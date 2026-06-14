const docx = require('docx');
const fs = require('fs');

const {
  Document, Packer, Paragraph, TextRun, HeadingLevel,
  AlignmentType, BorderStyle, TabStopPosition, TabStopType,
  PageBreak, ShadingType, ImageRun, Header, Footer,
  PageNumber, NumberFormat, SectionType
} = docx;

// ─── Color Palette ───
const NAVY = '0A1628';
const TEAL = '00C9A7';
const WHITE = 'FFFFFF';
const GRAY = '666666';
const LIGHT_GRAY = 'F5F7FA';
const DARK_TEXT = '1A1A2E';

// ─── Helper Functions ───
function accentDivider() {
  return new Paragraph({
    spacing: { before: 200, after: 200 },
    border: {
      bottom: { style: BorderStyle.SINGLE, size: 6, color: TEAL }
    }
  });
}

function sectionTitle(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 400, after: 200 },
    children: [
      new TextRun({
        text: text,
        bold: true,
        size: 56,
        font: 'Playfair Display',
        color: NAVY
      })
    ]
  });
}

function subSection(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 300, after: 150 },
    children: [
      new TextRun({
        text: text,
        bold: true,
        size: 36,
        font: 'Inter',
        color: NAVY
      })
    ]
  });
}

function bodyPara(text) {
  return new Paragraph({
    spacing: { before: 100, after: 100, line: 312 },
    children: [
      new TextRun({
        text: text,
        size: 22,
        font: 'Inter',
        color: DARK_TEXT
      })
    ]
  });
}

function boldBodyPara(text) {
  return new Paragraph({
    spacing: { before: 100, after: 100, line: 312 },
    children: [
      new TextRun({
        text: text,
        bold: true,
        size: 22,
        font: 'Inter',
        color: NAVY
      })
    ]
  });
}

function scriptLine(speaker, dialogue, direction) {
  const children = [];
  if (direction) {
    children.push(new TextRun({
      text: `[${direction}] `,
      italics: true,
      size: 20,
      font: 'Inter',
      color: TEAL
    }));
  }
  if (speaker) {
    children.push(new TextRun({
      text: `${speaker}: `,
      bold: true,
      size: 22,
      font: 'Inter',
      color: NAVY
    }));
  }
  children.push(new TextRun({
    text: dialogue,
    size: 22,
    font: 'Inter',
    color: DARK_TEXT
  }));
  return new Paragraph({
    spacing: { before: 80, after: 80, line: 312 },
    children
  });
}

function visualNote(text) {
  return new Paragraph({
    spacing: { before: 60, after: 60, line: 312 },
    indent: { left: 360 },
    children: [
      new TextRun({
        text: `VISUAL: ${text}`,
        italics: true,
        size: 20,
        font: 'Inter',
        color: GRAY
      })
    ]
  });
}

function audioNote(text) {
  return new Paragraph({
    spacing: { before: 60, after: 60, line: 312 },
    indent: { left: 360 },
    children: [
      new TextRun({
        text: `AUDIO: ${text}`,
        italics: true,
        size: 20,
        font: 'Inter',
        color: '8B5CF6'
      })
    ]
  });
}

function textOverlay(text) {
  return new Paragraph({
    spacing: { before: 60, after: 60, line: 312 },
    indent: { left: 360 },
    children: [
      new TextRun({
        text: `TEXT OVERLAY: "${text}"`,
        bold: true,
        size: 20,
        font: 'Inter',
        color: TEAL
      })
    ]
  });
}

function bulletPoint(text) {
  return new Paragraph({
    spacing: { before: 60, after: 60, line: 312 },
    indent: { left: 360 },
    children: [
      new TextRun({
        text: `\u2022  ${text}`,
        size: 22,
        font: 'Inter',
        color: DARK_TEXT
      })
    ]
  });
}

function quoteBlock(text, attribution) {
  return new Paragraph({
    spacing: { before: 200, after: 200, line: 312 },
    indent: { left: 720 },
    border: {
      left: { style: BorderStyle.SINGLE, size: 12, color: TEAL }
    },
    children: [
      new TextRun({
        text: `"${text}"`,
        italics: true,
        size: 24,
        font: 'Playfair Display',
        color: NAVY
      }),
      ...(attribution ? [new TextRun({
        text: `  \u2014 ${attribution}`,
        size: 20,
        font: 'Inter',
        color: GRAY
      })] : [])
    ]
  });
}

// ─── COVER IMAGE ───
const coverImage = fs.readFileSync('/home/z/my-project/download/documentary_scene_nurse.png');

// ─── BUILD DOCUMENT ───
const doc = new Document({
  styles: {
    default: {
      document: {
        run: {
          font: 'Inter',
          size: 22,
          color: DARK_TEXT
        }
      }
    }
  },
  sections: [
    // ═══ COVER PAGE ═══
    {
      properties: {
        page: {
          margin: { top: 0, bottom: 0, left: 0, right: 0 }
        }
      },
      children: [
        new Paragraph({
          children: [
            new ImageRun({
              data: coverImage,
              transformation: { width: 595, height: 340 },
              type: 'png'
            })
          ]
        }),
        new Paragraph({ spacing: { before: 400 } }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 200 },
          children: [
            new TextRun({
              text: 'NURSEOS',
              bold: true,
              size: 72,
              font: 'Playfair Display',
              color: NAVY
            })
          ]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 100 },
          children: [
            new TextRun({
              text: 'PREMIUM MEDIA PACKAGE',
              bold: true,
              size: 32,
              font: 'Inter',
              color: TEAL,
              characterSpacing: 200
            })
          ]
        }),
        accentDivider(),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 200 },
          children: [
            new TextRun({
              text: 'Cinematic Showcase Video Script',
              size: 24,
              font: 'Inter',
              color: GRAY
            })
          ]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 60 },
          children: [
            new TextRun({
              text: 'Founder Story Video Script',
              size: 24,
              font: 'Inter',
              color: GRAY
            })
          ]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 60 },
          children: [
            new TextRun({
              text: 'Brand Asset Specifications & Production Guide',
              size: 24,
              font: 'Inter',
              color: GRAY
            })
          ]
        }),
        new Paragraph({ spacing: { before: 600 } }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({
              text: 'WABI THE TECH NURSE',
              bold: true,
              size: 28,
              font: 'Inter',
              color: NAVY,
              characterSpacing: 100
            })
          ]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 60 },
          children: [
            new TextRun({
              text: 'Founder, NurseOS',
              size: 22,
              font: 'Inter',
              color: TEAL
            })
          ]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 100 },
          children: [
            new TextRun({
              text: '"Nursing is Beyond the Bedside."',
              italics: true,
              size: 24,
              font: 'Playfair Display',
              color: NAVY
            })
          ]
        })
      ]
    },

    // ═══ TABLE OF CONTENTS ═══
    {
      properties: {
        page: {
          margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 }
        }
      },
      children: [
        new Paragraph({
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 400, after: 300 },
          children: [
            new TextRun({
              text: 'TABLE OF CONTENTS',
              bold: true,
              size: 40,
              font: 'Inter',
              color: NAVY,
              characterSpacing: 100
            })
          ]
        }),
        accentDivider(),
        new Paragraph({ spacing: { before: 200 } }),
        boldBodyPara('PART I: CINEMATIC NURSEOS SHOWCASE VIDEO'),
        bulletPoint('Video Overview & Production Notes'),
        bulletPoint('Part 1 \u2014 The Challenge'),
        bulletPoint('Part 2 \u2014 The Idea'),
        bulletPoint('Part 3 \u2014 NurseOS Reveal'),
        bulletPoint('Part 4 \u2014 Impact'),
        bulletPoint('Part 5 \u2014 Vision'),
        bulletPoint('Post-Production & Music Notes'),
        new Paragraph({ spacing: { before: 200 } }),
        boldBodyPara('PART II: FOUNDER STORY VIDEO'),
        bulletPoint('Video Overview & Production Notes'),
        bulletPoint('Story Structure & Flow'),
        bulletPoint('Scene-by-Scene Script'),
        bulletPoint('Visual & Audio Direction'),
        new Paragraph({ spacing: { before: 200 } }),
        boldBodyPara('PART III: BRAND ASSET SPECIFICATIONS'),
        bulletPoint('Brand Color Palette & Typography'),
        bulletPoint('Product Mockup Guidelines'),
        bulletPoint('Social Media Asset Specs'),
        bulletPoint('Media Kit Components'),
        new Paragraph({ spacing: { before: 200 } }),
        boldBodyPara('PART IV: PRODUCTION GUIDELINES'),
        bulletPoint('Cinematography Standards'),
        bulletPoint('Music & Sound Design'),
        bulletPoint('Editing & Post-Production'),
        bulletPoint('Delivery Formats'),
      ]
    },

    // ═══ PART I: CINEMATIC SHOWCASE VIDEO ═══
    {
      properties: {
        page: {
          margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 }
        }
      },
      children: [
        sectionTitle('PART I: CINEMATIC NURSEOS SHOWCASE VIDEO'),
        accentDivider(),

        subSection('Video Overview'),
        bodyPara('This 60\u201390 second cinematic showcase positions NurseOS not as a software advertisement, but as a story of healthcare innovation born from clinical experience. The video should feel like the opening sequence of a Netflix documentary or a startup innovation showcase at a global technology conference. Every frame must communicate premium quality, medical authority, and the transformative power of nurse-led innovation.'),
        new Paragraph({ spacing: { before: 100 } }),
        boldBodyPara('Format: 16:9 cinematic, 4K preferred'),
        boldBodyPara('Duration: 60\u201390 seconds'),
        boldBodyPara('Tone: Documentary-style, aspirational, premium'),
        boldBodyPara('Music: Ambient orchestral with electronic undertones, building momentum'),
        boldBodyPara('Color Grade: Navy shadows, teal highlights, warm skin tones preserved'),

        subSection('Production Notes'),
        bodyPara('The video uses a technique of contrast: beginning with the weight and urgency of healthcare challenges, then pivoting to the clarity and possibility that NurseOS represents. Text overlays should use Playfair Display for headlines and Inter for body text, matching the NurseOS brand system. Transitions between sections should be smooth dissolves with subtle teal light leaks, never harsh cuts. Screen recordings of NurseOS should use cinematic zoom and highlight effects, not raw screen captures.'),

        // ─── PART 1: THE CHALLENGE ───
        subSection('PART 1 \u2014 THE CHALLENGE (0:00\u20130:18)'),
        bodyPara('The video opens with atmospheric, almost uncomfortable imagery of healthcare under strain. The pacing is deliberate and heavy. We want the viewer to feel the weight that nurses carry every day.'),

        visualNote('Slow motion: busy hospital corridor, nurses rushing between rooms, overhead fluorescent lights casting harsh shadows. Camera tracks behind a nurse walking purposefully down a hall.'),
        audioNote('Low, rumbling ambient tone. Distant hospital sounds \u2014 monitors beeping, footsteps, muffled voices. No music yet.'),
        textOverlay('Healthcare is evolving.'),
        new Paragraph({ spacing: { before: 100 } }),
        visualNote('Close-up: nurse\'s hands reviewing paper charts, then cutting to a digital screen showing patient alerts. The camera slowly pulls back to reveal a cluttered nursing station with multiple screens and handwritten notes side by side.'),
        audioNote('A single piano note enters, low and sustained. The ambient hospital sounds begin to fade.'),
        textOverlay('Nurses face growing demands.'),
        new Paragraph({ spacing: { before: 100 } }),
        visualNote('Wide shot: a nurse standing at a hospital window, silhouetted against dawn light. The composition is cinematic \u2014 the nurse appears small against the expanse of the healthcare system. Slow zoom in on the silhouette.'),
        audioNote('The piano builds with a second note, creating an unresolved tension. Strings begin to enter softly underneath.'),
        textOverlay('The future requires innovation.'),

        // ─── PART 2: THE IDEA ───
        subSection('PART 2 \u2014 THE IDEA (0:18\u20130:30)'),
        bodyPara('The pivot. The energy shifts from weight to possibility. This is where the story transforms from problem to potential. The visual language becomes brighter, more open, more forward-looking.'),

        visualNote('The silhouette at the window turns toward the camera. Light catches the nurse\'s face \u2014 determination, not defeat. The camera slowly pushes in as the ambient sound swells.'),
        audioNote('The orchestral arrangement begins to open up. The tense strings resolve into a hopeful progression. A subtle electronic pulse enters, representing the intersection of humanity and technology.'),
        textOverlay('What if nurses could help build the future?'),
        new Paragraph({ spacing: { before: 100 } }),
        visualNote('Abstract visual transition: the hospital corridor transforms through a digital lens \u2014 teal light traces begin to overlay the scene, suggesting data, connectivity, and intelligence. The nurse\'s silhouette becomes a silhouette against a digital healthcare network visualization.'),
        audioNote('The electronic pulse strengthens. The orchestral arrangement builds with confidence. A sense of momentum and discovery.'),
        textOverlay('What if a nurse could create technology for healthcare?'),

        // ─── PART 3: NURSEOS REVEAL ───
        subSection('PART 3 \u2014 NURSEOS REVEAL (0:30\u20131:00)'),
        bodyPara('The product showcase. This section must feel like watching the future of healthcare unfold, not like a software demo. Every screen recording should be enhanced with cinematic zooms, smooth callout animations, and teal highlight effects that draw the eye to key features. The pacing accelerates here to build excitement.'),

        visualNote('Clean transition: the digital network visualization resolves into the NurseOS homepage. Full-screen reveal with a subtle zoom animation. The teal accent color of the interface catches the light.'),
        audioNote('Music builds to its first peak \u2014 confident, modern, innovative. Electronic elements blend with orchestral for a sound that feels both human and technological.'),
        new Paragraph({ spacing: { before: 100 } }),
        boldBodyPara('SCREEN RECORDING SEQUENCE:'),
        new Paragraph({ spacing: { before: 100 } }),
        visualNote('1. Homepage \u2014 Smooth zoom into the hero section, highlighting "The Operating System for Global Nursing Care" tagline. Gentle pan across the page.'),
        visualNote('2. Dashboard \u2014 Cut to the main dashboard. Camera slowly zooms into the analytics widgets. Teal highlight callout appears on key metrics: patient count, vital signs alerts, staff coverage.'),
        visualNote('3. NurseAI Module \u2014 Screen recording of AI clinical decision support in action. Focus on the AI suggestions panel with confidence scores. Smooth zoom into a nursing care plan being generated in real-time.'),
        visualNote('4. CareGrid Referral \u2014 Transition to the referral network view. Show a referral being created from one facility to another. Highlight the inter-facility connection animation.'),
        visualNote('5. NurseID Credentials \u2014 Quick cut to the digital credentialing view. Show a verified license badge appearing with a subtle teal glow effect.'),
        visualNote('6. NurseAcademy \u2014 Final screen: a simulation scenario in progress. The AI evaluation panel slides in. Camera holds for a beat on the learning objectives and score.'),
        new Paragraph({ spacing: { before: 100 } }),
        visualNote('7. Mobile Experience \u2014 Transition to a smartphone mockup showing NurseOS on mobile. The device rotates slowly, showing responsive design. Thumb-friendly navigation demonstrated.'),
        visualNote('8. Full Interface Overview \u2014 Rapid montage: 6\u20138 quick cuts across different NurseOS features, each framed perfectly with teal accent highlights. The pace accelerates with the music.'),

        // ─── PART 4: IMPACT ───
        subSection('PART 4 \u2014 IMPACT (1:00\u20131:15)'),
        bodyPara('The emotional anchor. After the product showcase, we return to the human story. This section grounds the technology in its purpose \u2014 transforming healthcare by empowering nurses.'),

        visualNote('The rapid montage slows. We see a nurse at a workstation using NurseOS, but the framing is human \u2014 focused on the nurse\'s expression of confidence and clarity, not the screen itself. Soft teal light from the monitor illuminates their face.'),
        audioNote('The music transitions to its emotional core \u2014 strings swell, the electronic pulse softens, and the arrangement becomes deeply human and inspiring.'),
        textOverlay('Built by a Nurse.'),
        new Paragraph({ spacing: { before: 100 } }),
        visualNote('Close-up: hands navigating the NurseOS dashboard with ease. The movements are confident and fluid, showing mastery. The teal interface elements glow softly.'),
        textOverlay('Designed for Healthcare.'),
        new Paragraph({ spacing: { before: 100 } }),
        visualNote('Wide shot: a nurse leading a team meeting with NurseOS projected on a screen behind them. The composition shows leadership, authority, and innovation in a clinical setting.'),
        textOverlay('Driven by Innovation.'),
        new Paragraph({ spacing: { before: 100 } }),
        visualNote('Return to the silhouette from the opening \u2014 but now the nurse is facing forward, illuminated by teal-tinted light. The hospital behind them is no longer harsh but transformed, clean, modern.'),
        textOverlay('Created to Transform Healthcare.'),

        // ─── PART 5: VISION ───
        subSection('PART 5 \u2014 VISION (1:15\u20131:30)'),
        bodyPara('The close. Powerful, memorable, and brand-defining. The final image and words must stay with the viewer long after the video ends. This is the statement that defines the entire brand.'),

        visualNote('The scene slowly fades to a deep navy background. A single teal light source illuminates from behind the camera position, creating a halo effect. The nurse\'s silhouette is gone \u2014 we are now looking at the future itself.'),
        audioNote('The music reaches its quiet, powerful resolution. A single sustained note with gentle reverberation. Silence enters before the final text.'),
        new Paragraph({ spacing: { before: 100 } }),
        textOverlay('Nursing is Beyond the Bedside.'),
        new Paragraph({ spacing: { before: 100 } }),
        visualNote('Hold for 2 seconds on the text. Then a smooth fade transition.'),
        textOverlay('Wabi The Tech Nurse'),
        new Paragraph({ spacing: { before: 100 } }),
        textOverlay('Founder, NurseOS'),
        new Paragraph({ spacing: { before: 100 } }),
        visualNote('Final frame: the NurseOS wordmark and logo centered on the navy background with a subtle teal glow. Hold for 3 seconds. Fade to black.'),
        audioNote('The sustained note resolves. Two seconds of silence. Then a single, quiet teal-tinted tone that fades to nothing.'),

        subSection('Post-Production & Music Notes'),
        boldBodyPara('Color Grade:'),
        bodyPara('Shadows should be deep navy (#0A1628) rather than pure black. Highlights should carry a teal cast (#00C9A7) in the brightest areas. Skin tones must remain natural and warm \u2014 do not allow the teal cast to affect flesh tones. The overall look should feel like a high-end Apple or Nike commercial crossed with a Netflix documentary.'),
        boldBodyPara('Music Direction:'),
        bodyPara('Commission or license a track that blends orchestral and electronic elements. Reference tracks: Hans Zimmer\'s quieter work (Interstellar ambient passages), the opening theme of "The Morning Show," or premium tech brand campaign music (Apple, Tesla). The track should build from tension to resolution across 90 seconds, with a clear emotional peak at the NurseOS reveal and a powerful, quiet ending.'),
        boldBodyPara('Typography:'),
        bodyPara('All text overlays use Playfair Display for headlines and Inter for supporting text. Text should animate in with subtle fade and slight upward motion (20px over 0.5s). Never use harsh pop-in animations. Text color should be white (#FFFFFF) on dark backgrounds with a subtle drop shadow for readability.'),
        boldBodyPara('Screen Recording Guidelines:'),
        bodyPara('All NurseOS screen recordings must be captured at 4K resolution with a consistent viewport. Apply a subtle depth-of-field blur to background elements during zooms. Use smooth 30fps animation for all transitions. Add teal highlight callouts (animated outlines with soft glow) to draw attention to key features. Never show raw browser chrome \u2014 always use a clean, framed presentation of the interface.'),
      ]
    },

    // ═══ PART II: FOUNDER STORY VIDEO ═══
    {
      properties: {
        page: {
          margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 }
        }
      },
      children: [
        sectionTitle('PART II: FOUNDER STORY VIDEO'),
        accentDivider(),

        subSection('Video Overview'),
        bodyPara('This is not a product video. This is the story of a nurse who became a builder. The Founder Story Video introduces Wabi as a human being first, a nurse second, and a technology founder third. The audience should finish this video understanding that NurseOS exists because a nurse decided to build the future rather than wait for someone else to do it. The video should feel intimate, authentic, and deeply inspiring \u2014 like a TED Talk meets a Netflix documentary profile.'),
        new Paragraph({ spacing: { before: 100 } }),
        boldBodyPara('Format: 16:9 cinematic, 4K preferred'),
        boldBodyPara('Duration: 3\u20135 minutes'),
        boldBodyPara('Tone: Intimate, authentic, leadership-driven, aspirational'),
        boldBodyPara('Structure: Interview footage intercut with NurseOS visuals and healthcare b-roll'),
        boldBodyPara('Music: Warm, intimate piano/strings that builds to inspiring orchestral'),

        subSection('Story Structure'),
        bodyPara('The video follows a five-act structure that mirrors the hero\'s journey: Origin, Calling, Challenge, Creation, and Vision. Each act reveals a deeper layer of who Wabi is and why NurseOS matters. The interview should feel like a conversation, not a corporate Q&A. Wabi should speak directly to camera in a controlled, intimate setting with premium lighting.'),

        // ─── SCENE 1: WHO IS WABI? ───
        subSection('SCENE 1 \u2014 WHO IS WABI? (Origin)'),
        bodyPara('Open with close-up interview footage. The lighting is warm and intimate \u2014 a single key light creating depth, with a subtle teal accent rim light. The background is softly out of focus, suggesting a modern, professional environment without distraction.'),

        scriptLine('WABI', 'I\'m a nurse. That\'s where my story starts \u2014 and that\'s where it always comes back to.', 'Direct to camera, warm lighting, slight smile'),
        new Paragraph({ spacing: { before: 100 } }),
        visualNote('B-roll: Wabi in professional setting, walking through a modern workspace. Cut to historical photos or reenactment of nursing training.'),
        scriptLine('WABI', 'When I was at the bedside, I saw the gaps. Not just in one hospital or one ward \u2014 but in the entire system. Nurses were carrying the weight of healthcare on their shoulders, and the tools they were given were never designed for how they actually work.', 'Reflective, measured pace'),
        new Paragraph({ spacing: { before: 100 } }),
        visualNote('Slow-motion: close-up of a nurse\'s hands \u2014 writing notes, checking equipment, holding a patient\'s hand. The imagery is respectful and human.'),
        scriptLine('WABI', 'I loved being a nurse. But I kept asking myself: why isn\'t technology working the way we need it to? Why are we still fighting our tools instead of being empowered by them?'),

        // ─── SCENE 2: WHY NURSING? ───
        subSection('SCENE 2 \u2014 WHY NURSING? (Calling)'),
        bodyPara('This section establishes Wabi\'s deep connection to the nursing profession. The audience must understand that NurseOS was not built despite Wabi being a nurse \u2014 it was built because of it.'),

        visualNote('Cut to interview. Wabi\'s expression is earnest and passionate. The camera pushes in slowly.'),
        scriptLine('WABI', 'Nursing chose me. And once I understood what it meant to care for someone at their most vulnerable moment, I couldn\'t unsee it. Nursing isn\'t a job \u2014 it\'s a lens through which you see the entire world differently.'),
        new Paragraph({ spacing: { before: 100 } }),
        visualNote('B-roll montage: nurses at work across different settings \u2014 emergency department, community health, pediatric ward, home care. Each clip is framed beautifully, showing the diversity and depth of nursing practice.'),
        scriptLine('WABI', 'Nurses are the backbone of healthcare. We\'re the ones at the bedside 12 hours a day. We\'re the ones who notice the subtle changes in a patient\'s condition before anyone else. We\'re the ones coordinating care, advocating for patients, managing medications, and holding everything together.'),
        new Paragraph({ spacing: { before: 100 } }),
        scriptLine('WABI', 'But the world doesn\'t always see that. The world sees nursing as a support role. I see it as the front line of healthcare innovation.'),

        // ─── SCENE 3: WHY TECHNOLOGY? ───
        subSection('SCENE 3 \u2014 WHY TECHNOLOGY? (Challenge)'),
        bodyPara('The pivot from nursing to technology. This is where the audience sees Wabi not just as a nurse with an idea, but as a problem-solver who took action.'),

        visualNote('Interview setting shifts slightly \u2014 the lighting becomes more focused, the background now includes subtle technology elements (a screen with data, a clean modern desk). The mood is determined.'),
        scriptLine('WABI', 'I didn\'t start out wanting to build technology. I started out wanting to solve a problem. And the problem was clear: the technology that nurses were given was designed by people who had never done our job.'),
        new Paragraph({ spacing: { before: 100 } }),
        visualNote('Cut to: examples of clunky, outdated healthcare software interfaces. Then immediately cut to: Wabi sketching ideas, reviewing code, working with a team. The contrast is intentional.'),
        scriptLine('WABI', 'Every nurse has had that moment \u2014 staring at a screen that makes no sense, clicking through seven menus to do something that should take one step, watching a system crash in the middle of a medication verification. That\'s not just frustrating. That\'s dangerous.'),
        new Paragraph({ spacing: { before: 100 } }),
        scriptLine('WABI', 'I realized that if I was complaining about the technology, I had two choices: keep complaining, or start building. I chose to build.'),

        // ─── SCENE 4: WHY NURSEOS? ───
        subSection('SCENE 4 \u2014 WHY NURSEOS? (Creation)'),
        bodyPara('The product reveal through the founder\'s eyes. NurseOS is shown not as a product demo, but as the realization of a vision. Every feature traces back to a real clinical experience.'),

        visualNote('The interview footage intercuts with premium NurseOS screen recordings \u2014 but framed differently than the Showcase Video. Here, we see Wabi\'s hands navigating the interface, or we see the screen reflected in their eyes. The product is shown as an extension of the founder.'),
        scriptLine('WABI', 'NurseOS is everything I wished I had at the bedside. AI that helps you make clinical decisions, not replaces them. A referral network that connects facilities so patients don\'t fall through the cracks. Credentialing that actually tracks your professional growth. Education that meets you where you are.'),
        new Paragraph({ spacing: { before: 100 } }),
        visualNote('Quick cuts: NurseAI suggesting a care plan, CareGrid connecting two facilities, NurseID displaying a verified credential, NurseAcademy simulation in progress. Each clip is 2\u20133 seconds, perfectly framed.'),
        scriptLine('WABI', 'Every feature in NurseOS comes from a real moment. A real patient. A real problem that I or another nurse faced. This isn\'t theoretical \u2014 this is lived experience turned into technology.'),
        new Paragraph({ spacing: { before: 100 } }),
        quoteBlock('Nursing is Beyond the Bedside.', 'Wabi, Founder, NurseOS'),

        // ─── SCENE 5: THE VISION ───
        subSection('SCENE 5 \u2014 THE VISION (Future)'),
        bodyPara('The closing. The audience should leave feeling inspired and believing that the future of healthcare can be shaped by nurses. This is the most emotionally powerful section.'),

        visualNote('The interview setting opens up \u2014 wider shot, more light, a sense of possibility. Wabi is standing now, not sitting. The body language is forward-looking, confident, visionary.'),
        scriptLine('WABI', 'I want every nurse to know that they are not just users of technology. They can be creators. They can be founders. They can be the ones who decide what the future of healthcare looks like.'),
        new Paragraph({ spacing: { before: 100 } }),
        visualNote('B-roll: nurses in various settings \u2014 but now the imagery is aspirational. A nurse leading a team. A nurse presenting at a conference. A nurse reviewing analytics on a tablet and making a decision. The visual language has shifted from "struggle" to "leadership."'),
        scriptLine('WABI', 'The next generation of nurses shouldn\'t have to choose between clinical practice and innovation. NurseOS is proof that you can do both. You can care for patients and build the tools that transform care for millions.'),
        new Paragraph({ spacing: { before: 100 } }),
        visualNote('Final shot: Wabi looking directly into camera. The background is the navy-darkened hospital corridor from the Showcase Video, but now it feels like a path forward, not a challenge.'),
        scriptLine('WABI', 'Nursing is beyond the bedside. And I\'m just getting started.'),
        new Paragraph({ spacing: { before: 200 } }),
        visualNote('Fade to: NurseOS wordmark on navy background with teal glow. Hold 3 seconds. Fade to black.'),
        audioNote('The music resolves to its final, most emotional note. A single sustained chord that carries warmth, hope, and determination. Silence. End.'),

        subSection('Visual & Audio Direction'),
        boldBodyPara('Interview Setup:'),
        bodyPara('Two-camera interview with a shallow depth of field. Camera A: straight-on medium close-up for direct engagement. Camera B: 45-degree angle for reflective moments. Key light with soft teal rim light. Background: modern, warm, slightly out of focus. The viewer should feel like they\'re in a private conversation, not watching a corporate video.'),
        boldBodyPara('B-Roll Philosophy:'),
        bodyPara('Every piece of b-roll should serve the story emotionally. Avoid generic stock footage. When possible, shoot original b-roll in real healthcare environments with real nurses (with proper consent). The imagery should be respectful, human, and beautiful. Frame nurses as professionals and leaders, not as background characters in the healthcare system.'),
        boldBodyPara('Music Direction:'),
        bodyPara('Commission or license a warm, intimate piano and strings composition that builds gradually. Reference: the music from "The Social Network" quiet moments, Max Richter\'s "On the Nature of Daylight," or Nils Frahm\'s piano work. The track should feel personal and authentic \u2014 never corporate or generic. It should support Wabi\'s words without competing with them.'),
        boldBodyPara('Transition Style:'),
        bodyPara('Transitions between interview and b-roll should use smooth dissolves (0.5\u20131.0 seconds). When cutting to NurseOS screen recordings, use a subtle "digital reveal" effect \u2014 the interface appears as if emerging from a teal-tinted digital canvas. Avoid harsh cuts or flashy transitions. The pacing should feel like breathing \u2014 natural, unhurried, confident.'),
      ]
    },

    // ═══ PART III: BRAND ASSET SPECIFICATIONS ═══
    {
      properties: {
        page: {
          margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 }
        }
      },
      children: [
        sectionTitle('PART III: BRAND ASSET SPECIFICATIONS'),
        accentDivider(),

        subSection('Brand Color Palette'),
        boldBodyPara('Primary Colors:'),
        bulletPoint('Navy (#0A1628) \u2014 Primary background, conveys authority and medical professionalism'),
        bulletPoint('White (#FFFFFF) \u2014 Primary text, conveys clarity and precision'),
        bulletPoint('Teal (#00C9A7) \u2014 Accent color, conveys innovation, health, and digital intelligence'),
        boldBodyPara('Supporting Colors:'),
        bulletPoint('Navy Card (#111D33) \u2014 Card and panel backgrounds'),
        bulletPoint('Teal Light (#00E5BE) \u2014 Hover states and highlights'),
        bulletPoint('Teal Dark (#00A88A) \u2014 Active states and emphasis'),
        bulletPoint('White Muted (rgba 255,255,255,0.7) \u2014 Secondary text'),
        bulletPoint('White Dim (rgba 255,255,255,0.4) \u2014 Tertiary text and placeholders'),
        boldBodyPara('Color Usage Rules:'),
        bodyPara('Teal should never exceed 20% of any composition. Navy is the dominant color. White provides contrast and readability. Teal is the exclamation mark, not the sentence. On light backgrounds, use Navy as the primary text color with Teal accents.'),

        subSection('Typography System'),
        boldBodyPara('Headlines: Playfair Display'),
        bodyPara('An elegant serif typeface that communicates authority, tradition, and premium quality. Used for all headlines, slide titles, video text overlays, and the NurseOS wordmark. Weights: Regular (400), Medium (500), Semi-Bold (600), Bold (700).'),
        boldBodyPara('Body Text: Inter'),
        bodyPara('A modern sans-serif typeface designed for digital interfaces. Used for all body text, captions, UI elements, and supporting information. Weights: Light (300), Regular (400), Medium (500), Semi-Bold (600), Bold (700). Inter communicates clarity, modernity, and technological sophistication.'),
        boldBodyPara('Never use:'),
        bulletPoint('Comic Sans, Papyrus, or any decorative/casual fonts'),
        bulletPoint('System fonts (Arial, Times New Roman) for branded materials'),
        bulletPoint('More than two typeface families in any single composition'),

        subSection('Product Mockup Guidelines'),
        bodyPara('All product mockups must convey the following: NurseOS is a premium healthcare technology platform displayed in professional healthcare environments. The devices should be modern Apple products (MacBook Pro, iPad Pro, iPhone 15 Pro). The surrounding environment should be clean, modern, and clinical but warm \u2014 not sterile or cold.'),
        boldBodyPara('Required Mockup Formats:'),
        bulletPoint('Smartphone (iPhone 15 Pro): Show the NurseOS mobile interface with dashboard or patient vitals view. Healthcare setting: nurse holding the phone at a nursing station.'),
        bulletPoint('Tablet (iPad Pro): Show the NurseOS dashboard with analytics or the NurseAI clinical decision support. Healthcare setting: nurse reviewing patient data during rounds.'),
        bulletPoint('Laptop (MacBook Pro): Show the full NurseOS platform with multiple modules visible. Healthcare setting: nurse at a desk in a modern office or conference room.'),
        bulletPoint('Desktop (iMac or ultrawide monitor): Show the comprehensive facility analytics dashboard. Healthcare setting: a nurse leader or administrator in a modern healthcare management office.'),
        boldBodyPara('Mockup Style Rules:'),
        bodyPara('Background environments should use shallow depth of field with warm, natural lighting. No artificial studio lighting. The teal accent color from NurseOS interfaces should complement the navy clinical environment. No cartoon or flat-design mockups. All mockups must be photorealistic or 3D-rendered at production quality. Avoid showing patient data or protected health information in mockups \u2014 use synthetic, realistic-looking data.'),

        subSection('Social Media Asset Specifications'),
        boldBodyPara('LinkedIn Banner (1584 x 396 px):'),
        bodyPara('Use the navy gradient background with teal accent lines and abstract digital health network pattern. Include the NurseOS wordmark on the left and "Nursing is Beyond the Bedside" tagline. Leave space for the profile picture overlay on the left side.'),
        boldBodyPara('Instagram Profile (320 x 320 px avatar):'),
        bodyPara('The NurseOS "N" monogram in white on a navy background with a subtle teal glow. Clean, recognizable at small sizes.'),
        boldBodyPara('Instagram/Twitter Cover (1500 x 500 px):'),
        bodyPara('Cinematic hospital corridor with teal-tinted lighting. NurseOS wordmark and tagline. No clutter, maximum impact.'),
        boldBodyPara('Speaker Profile Graphic (1080 x 1080 px):'),
        bodyPara('Dark navy background with teal border frame. Name: "Wabi The Tech Nurse" in Playfair Display. Title: "Nurse | Innovator | Founder | Healthcare Technology Advocate" in Inter. Position for headshot photo overlay. Quote: "Nursing is Beyond the Bedside."'),
        boldBodyPara('Founder Introduction Card (1080 x 1350 px):'),
        bodyPara('Elegant card format with navy background and teal accent borders. "WT" monogram in Playfair Display. Name, titles, and one-paragraph bio. NurseOS wordmark and website at the bottom.'),

        subSection('Media Kit Components'),
        bodyPara('The complete NurseOS media kit should include the following components, all designed with the navy/teal/white palette and Playfair Display + Inter typography:'),
        bulletPoint('Brand Overview: One-page summary of NurseOS mission, vision, and positioning statement'),
        bulletPoint('Founder Bio: Professional biography of Wabi The Tech Nurse with headshot placeholder'),
        bulletPoint('Product Fact Sheet: Key features, benefits, and differentiators in a clean, scannable format'),
        bulletPoint('Brand Assets ZIP: Logos (SVG, PNG, white-on-dark, dark-on-white), color palette swatches, typography files'),
        bulletPoint('Press Release Template: Pre-formatted template in NurseOS brand style for announcements'),
        bulletPoint('Social Media Guidelines: Approved hashtags, caption style, visual standards, and tone of voice'),
        bulletPoint('Partnership Deck: 4-page mini-deck for potential sponsors and partners (can be derived from the main pitch deck)'),
      ]
    },

    // ═══ PART IV: PRODUCTION GUIDELINES ═══
    {
      properties: {
        page: {
          margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 }
        }
      },
      children: [
        sectionTitle('PART IV: PRODUCTION GUIDELINES'),
        accentDivider(),

        subSection('Cinematography Standards'),
        bodyPara('All NurseOS video content must meet broadcast-quality standards. The visual language should be consistent with premium documentary production and luxury brand campaigns. These standards apply to both the Cinematic Showcase Video and the Founder Story Video.'),
        boldBodyPara('Camera:'),
        bodyPara('Minimum 4K capture (3840 x 2160) using a cinema camera or full-frame mirrorless with professional video capabilities (Sony FX6, Canon C70, RED Komodo, or equivalent). Interview footage should use two cameras for coverage. All footage should be shot in a flat or log color profile for maximum grading flexibility in post-production.'),
        boldBodyPara('Lenses:'),
        bodyPara('Prime lenses preferred for their cinematic quality and shallow depth of field. Interview: 50mm or 85mm f/1.4 for flattering close-ups with beautiful bokeh. B-roll: 24mm or 35mm for environmental context, 85mm or 135mm for intimate details. Macro lens available for product detail shots (hands on keyboard, screen close-ups).'),
        boldBodyPara('Lighting:'),
        bodyPara('Three-point lighting for interviews with a warm key light (5600K or slightly warmer), subtle teal-tinted rim light (using a #00C9A7 gel at low intensity), and a soft fill. The teal rim light creates a brand-consistent visual signature. For b-roll, use available natural light supplemented with LED panels. Avoid flat, even lighting \u2014 create depth and dimension with contrast.'),
        boldBodyPara('Framing:'),
        bodyPara('Interview: medium close-up (head and shoulders) with the subject looking slightly off-camera. The rule of thirds should be observed but can be broken intentionally for dramatic effect. B-roll: a mix of wide establishing shots, medium action shots, and close-up detail shots. Product shots: centered with consistent padding, using the rule of thirds for interface elements within the frame.'),

        subSection('Music & Sound Design'),
        bodyPara('Sound is 50% of the experience. The music and sound design must be treated with the same level of care and intention as the visuals. Poor audio will immediately destroy the premium feel that the visuals establish.'),
        boldBodyPara('Music Licensing:'),
        bodyPara('Commission original music if budget allows, or license from premium stock music libraries (Musicbed, Artlist, Marmoset). Never use recognizable popular music tracks. The music must feel original and specific to the NurseOS brand. License must cover all intended distribution channels including social media, web, and live presentations.'),
        boldBodyPara('Sound Design:'),
        bodyPara('Subtle sound effects should enhance transitions and key moments: a soft digital "whoosh" for screen transitions, a gentle "ping" for text overlay appearances, ambient healthcare sounds (monitors, footsteps) for realism in b-roll sections. All sound effects should be mixed at -12dB to -18dB below the music, creating a subliminal enhancement rather than a distraction. No harsh or jarring sound effects.'),

        subSection('Editing & Post-Production'),
        boldBodyPara('Editing Software:'),
        bodyPara('DaVinci Resolve, Adobe Premiere Pro, or Final Cut Pro. All editing should be done in 4K timeline with color grading in DaVinci Resolve or a dedicated color grading application for maximum quality.'),
        boldBodyPara('Pacing:'),
        bodyPara('The Showcase Video should follow a rhythm: slow and heavy (The Challenge) \u2192 building energy (The Idea) \u2192 dynamic and confident (NurseOS Reveal) \u2192 emotional and grounded (Impact) \u2192 powerful and quiet (Vision). The Founder Story Video should maintain a contemplative, intimate pace with strategic accelerations during product reveals and emotional peaks.'),
        boldBodyPara('Transitions:'),
        bodyPara('Smooth dissolves (0.5\u20131.0 seconds) for narrative transitions. Subtle "digital reveal" effects for product interface appearances. No hard cuts between dramatically different visual tones. Cross-dissolves between interview and b-roll footage. Fade to black for section endings. Never use novelty transitions (wipes, spins, zooms).'),
        boldBodyPara('Color Grading:'),
        bodyPara('Apply a consistent color grade across all footage. Shadows pushed toward navy (#0A1628). Highlights carrying a subtle teal cast (#00C9A7) without affecting skin tones. Contrast should be rich but not crushed. The grade should feel cinematic and intentional \u2014 not like a social media filter. Reference: Apple product videos, Netflix documentary series, premium healthcare brand campaigns.'),
        boldBodyPara('Export Settings:'),
        bodyPara('Master: ProRes 422 HQ or DNxHR HQ at 4K (3840 x 2160, 23.976fps). Delivery: H.265 at 4K and 1080p for web distribution. Social media versions: 1:1 (1080x1080) and 9:16 (1080x1920) cropped versions of both videos for Instagram Reels, TikTok, and YouTube Shorts.'),

        subSection('Delivery Formats'),
        bodyPara('All deliverables should be organized in a structured folder hierarchy and delivered via cloud storage (Google Drive, Dropbox, or WeTransfer for large files).'),
        boldBodyPara('Video Deliverables:'),
        bulletPoint('Cinematic Showcase Video \u2014 4K master (ProRes), 4K web (H.265), 1080p web (H.265), 1:1 social crop, 9:16 social crop'),
        bulletPoint('Founder Story Video \u2014 4K master (ProRes), 4K web (H.265), 1080p web (H.265), 1:1 social crop, 9:16 social crop'),
        boldBodyPara('Image Deliverables:'),
        bulletPoint('Product Mockups \u2014 Smartphone, Tablet, Laptop, Desktop (PNG at 300dpi for print, PNG at 72dpi for web)'),
        bulletPoint('Social Media Assets \u2014 All sizes specified in Part III (PNG format)'),
        bulletPoint('Brand Assets \u2014 Logos (SVG + PNG), color swatches, typography files, brand guidelines PDF'),
        boldBodyPara('Document Deliverables:'),
        bulletPoint('Pitch Deck \u2014 PPTX and PDF versions'),
        bulletPoint('Media Kit \u2014 PDF with all brand specifications'),
        bulletPoint('Video Scripts \u2014 This document (DOCX and PDF)'),
      ]
    }
  ]
});

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync('/home/z/my-project/download/NurseOS_Video_Scripts_and_Production_Guide.docx', buffer);
  console.log('Document created successfully!');
});
