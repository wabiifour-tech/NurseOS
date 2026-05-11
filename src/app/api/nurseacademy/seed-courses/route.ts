import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

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
  modules: [string, string, string, number][]; // [title, description, contentType, durationMinutes]
}

export async function POST(request: Request) {
  try {
    // Auth check - in production, verify admin role
    const body = await request.json().catch(() => ({}));
    const forceReimport = body?.force === true;

    // Check current course count
    const existingCount = await prisma.course.count();
    if (existingCount >= 280 && !forceReimport) {
      return NextResponse.json({
        message: `Courses already seeded (${existingCount} courses exist). Use force:true to reimport.`,
        count: existingCount,
      });
    }

    console.log(`📚 Starting bulk course import... (existing: ${existingCount})`);

    // Read JSON files
    const part1Path = path.join(process.cwd(), 'courses_part1.json');
    const part2Path = path.join(process.cwd(), 'courses_part2.json');

    const part1: CourseData[] = JSON.parse(fs.readFileSync(part1Path, 'utf-8'));
    const part2: CourseData[] = JSON.parse(fs.readFileSync(part2Path, 'utf-8'));
    const allCourses = [...part1, ...part2];

    console.log(`📖 Loaded ${allCourses.length} courses from JSON files`);

    let imported = 0;
    let skipped = 0;
    let errors = 0;

    // Get existing slugs to avoid duplicates
    const existingSlugs = new Set(
      (await prisma.course.findMany({ select: { slug: true } })).map(c => c.slug)
    );

    // Process in batches to avoid memory issues
    const BATCH_SIZE = 20;
    for (let i = 0; i < allCourses.length; i += BATCH_SIZE) {
      const batch = allCourses.slice(i, i + BATCH_SIZE);

      for (const courseData of batch) {
        try {
          // Skip if slug already exists
          if (existingSlugs.has(courseData.slug)) {
            skipped++;
            continue;
          }

          // Validate level
          const validLevels = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT'];
          const level = validLevels.includes(courseData.level) ? courseData.level : 'INTERMEDIATE';

          // Create course with modules in a transaction
          const course = await prisma.course.create({
            data: {
              title: courseData.title,
              slug: courseData.slug,
              description: courseData.description,
              category: courseData.category,
              level: level,
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
                await prisma.courseModule.create({
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
          // Handle unique constraint violations gracefully
          if (err.code === 'P2002') {
            skipped++;
          } else {
            errors++;
            console.error(`  Error importing "${courseData.title}":`, err.message);
          }
        }
      }
    }

    const finalCount = await prisma.course.count();
    const moduleCount = await prisma.courseModule.count();

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
    const courseCount = await prisma.course.count();
    const moduleCount = await prisma.courseModule.count();
    const categories = await prisma.course.groupBy({
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
