import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth';

interface CourseData {
  title: string;
  slug: string;
  description: string;
  category: string;
  level: string;
  durationMinutes: number;
  cpdPoints: number;
  language: string;
  tags: string[];
  isFree: boolean;
  price: number | null;
  enrollmentCount: number;
  rating: number;
  totalRatings: number;
  modules: [string, string, string, number][];
}

// Import JSON data directly - Next.js handles this at build time
import part1Data from '@/data/courses_part1.json';
import part2Data from '@/data/courses_part2.json';

export async function POST(request: NextRequest) {
  // 🔒 Require admin authentication for destructive operations
  const authUser = await getAuthenticatedUser(request)
  if (!authUser) return unauthorizedResponse()
  if (authUser.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  }

  try {
    let body;
    try {
      body = await request.json();
    } catch {
      body = {};
    }
    const forceReimport = body?.force === true;

    // Check current course count
    const existingCount = await db.course.count();
    if (existingCount >= 280 && !forceReimport) {
      return NextResponse.json({
        message: `Courses already seeded (${existingCount} courses exist). Use force:true to reimport.`,
        count: existingCount,
      });
    }

    console.log(`📚 Starting bulk course import... (existing: ${existingCount})`);

    const allCourses: CourseData[] = [...(part1Data as CourseData[]), ...(part2Data as CourseData[])];
    console.log(`📖 Loaded ${allCourses.length} courses from JSON data`);

    let imported = 0;
    let skipped = 0;
    let errors = 0;

    // Get existing slugs to avoid duplicates
    const existingSlugs = new Set(
      (await db.course.findMany({ select: { slug: true } })).map(c => c.slug)
    );

    const validLevels = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT'];

    for (const courseData of allCourses) {
      try {
        // Skip if slug already exists
        if (existingSlugs.has(courseData.slug)) {
          skipped++;
          continue;
        }

        // Validate level
        const level = validLevels.includes(courseData.level) ? courseData.level : 'INTERMEDIATE';

        // Create course
        const course = await db.course.create({
          data: {
            title: courseData.title,
            slug: courseData.slug,
            description: courseData.description,
            category: courseData.category,
            level,
            durationMinutes: courseData.durationMinutes,
            cpdPoints: courseData.cpdPoints,
            language: courseData.language || 'en',
            tags: JSON.stringify(courseData.tags || []),
            isPublished: true,
            isFree: courseData.isFree,
            price: courseData.price,
            enrollmentCount: courseData.enrollmentCount || 0,
            rating: courseData.rating || 0,
            totalRatings: courseData.totalRatings || 0,
          },
        });

        // Create course modules
        if (courseData.modules && Array.isArray(courseData.modules)) {
          for (let m = 0; m < courseData.modules.length; m++) {
            const mod = courseData.modules[m];
            if (Array.isArray(mod) && mod.length >= 3) {
              await db.courseModule.create({
                data: {
                  courseId: course.id,
                  title: mod[0] as string,
                  description: mod[1] as string,
                  order: m + 1,
                  contentType: (mod[2] as string) || 'TEXT',
                  durationMinutes: (mod[3] as number) || 30,
                  isRequired: true,
                },
              });
            }
          }
        }

        existingSlugs.add(courseData.slug);
        imported++;

        if (imported % 50 === 0) {
          console.log(`  Imported ${imported} courses so far...`);
        }
      } catch (err: any) {
        if (err.code === 'P2002') {
          skipped++;
        } else {
          errors++;
          console.error(`  Error importing "${courseData.title}":`, err.message);
        }
      }
    }

    const finalCount = await db.course.count();
    const moduleCount = await db.courseModule.count();

    console.log(`✅ Import complete: ${imported} imported, ${skipped} skipped, ${errors} errors`);
    console.log(`   Total courses: ${finalCount}, Total modules: ${moduleCount}`);

    return NextResponse.json({
      success: true,
      imported,
      skipped,
      errors,
      totalCourses: finalCount,
      totalModules: moduleCount,
    });
  } catch (error: any) {
    console.error('Course import error:', error);
    return NextResponse.json(
      { error: 'Failed to import courses', details: error.message },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const courseCount = await db.course.count();
    const moduleCount = await db.courseModule.count();
    const categories = await db.course.groupBy({
      by: ['category'],
      _count: { category: true },
      orderBy: { _count: { category: 'desc' } },
    });

    return NextResponse.json({
      totalCourses: courseCount,
      totalModules: moduleCount,
      categories: categories.map(c => ({
        name: c.category,
        count: c._count.category,
      })),
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to fetch course stats', details: error.message },
      { status: 500 }
    );
  }
}
