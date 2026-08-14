import type { LessonSpec } from '../registry/types'

/**
 * Demo lesson specs for Physics 9–10, Chapter 1 — ভৌত রাশি এবং তাদের পরিমাপ.
 *
 * In production these come from the API (Lesson + LessonComponent + Simulation
 * + SimulationParameter). They are inlined here so the renderers can be
 * developed and demonstrated before the database is stood up. The shape matches
 * the schema exactly, so swapping in a fetch changes only where the data comes
 * from — not what the components receive.
 *
 * Every `sourcePage` is a real page of the NCTB 2026 edition and is what
 * TextbookReference / ContentValidation will point at.
 */

export const chapter01Lessons: LessonSpec[] = [
  {
    id: 1,
    titleBn: 'রাশির মাপনী — কত বড়, কত ছোট',
    titleEn: 'The Scale of Things',
    components: [
      {
        id: 101,
        componentType: 'EXPLANATION',
        displayOrder: 1,
        sourcePage: 15,
        bodyBn:
          'এই ভৌতজগতে অসংখ্য বিষয় রয়েছে, যা পরিমাপ করা সম্ভব। প্রোটনের ব্যাসার্ধ থেকে শুরু করে নিকটতম গ্যালাক্সির দূরত্ব পর্যন্ত — সবকিছুই একই সাতটি মৌলিক একক দিয়ে প্রকাশ করা যায়। নিচের মাপনীতে দেখো, দূরত্ব, ভর ও সময়ের পরিসর কত বিশাল।',
        bodyEn:
          'Countless things in the physical world can be measured, from the radius of a proton to the distance of the nearest galaxy — all expressed with the same seven base units. Explore how vast the range of distance, mass and time really is.',
      },
      {
        id: 102,
        componentType: 'VISUALIZATION',
        displayOrder: 2,
        rendererType: 'VIZ_LOG_SCALE_EXPLORER',
        sourcePage: 15,
        config: {},
        parameters: {},
      },
    ],
  },
  {
    id: 2,
    titleBn: 'ভার্নিয়ার ক্যালিপার্স',
    titleEn: 'Vernier Calipers',
    components: [
      {
        id: 201,
        componentType: 'EXPLANATION',
        displayOrder: 1,
        sourcePage: 20,
        bodyBn:
          'একটা স্কেলে সবচেয়ে যে সূক্ষ্ম দাগ থাকে আমরা সে পর্যন্ত মাপতে পারি। মিটার স্কেল সাধারণত মিলিমিটার পর্যন্ত ভাগ করা থাকে। তার চেয়ে সূক্ষ্মভাবে মাপার প্রয়োজন হলে ভার্নিয়ার স্কেল ব্যবহার করা হয়। ভার্নিয়ার স্কেলের প্রত্যেকটি ভাগ মূল স্কেলের এক ভাগের চেয়ে সামান্য ছোট — এই পার্থক্যই সূক্ষ্ম পরিমাপ সম্ভব করে।',
        bodyEn:
          'A scale can only be read to its smallest division — usually a millimetre. To measure more finely, a vernier scale is used: each of its divisions is slightly shorter than a main-scale division, and that difference is what makes precise measurement possible.',
      },
      {
        id: 202,
        componentType: 'SIMULATION',
        displayOrder: 2,
        rendererType: 'SIM_VERNIER_CALIPER',
        sourcePage: 21,
        config: { maxLengthMm: 60 },
        parameters: {
          mainScaleDivision: 1,
          vernierDivisions: 10,
          objectLength: 24.4,
          mode: 'explore',
        },
      },
      {
        id: 203,
        componentType: 'EXERCISE',
        displayOrder: 3,
        rendererType: 'SIM_VERNIER_CALIPER',
        sourcePage: 25,
        config: { maxLengthMm: 60 },
        parameters: {
          mainScaleDivision: 1,
          vernierDivisions: 10,
          mode: 'practice',
        },
      },
    ],
  },
  {
    id: 3,
    titleBn: 'স্ক্রু-গেইজ',
    titleEn: 'Screw Gauge',
    components: [
      {
        id: 301,
        componentType: 'EXPLANATION',
        displayOrder: 1,
        sourcePage: 22,
        bodyBn:
          'ভার্নিয়ার স্কেলের পরিবর্তে একটা স্ক্রুকে ঘুরিয়ে স্কেলকে সামনে-পেছনে নিয়েও স্ক্রু-গেইজ নামে বিশেষ একধরনের স্কেলে দৈর্ঘ্য মাপা হয়। পুরো একবার ঘোরানোর পর স্কেল ১ মিলিমিটার অগ্রসর হয় — একে স্ক্রুর পিচ বলে। বৃত্তাকার অংশটি ১০০ ভাগে ভাগ করা হলে প্রতি এক ঘর ঘূর্ণনে ০.০১ মিলিমিটার পর্যন্ত মাপা সম্ভব।',
        bodyEn:
          'Instead of a vernier scale, a screw gauge advances a scale by turning a screw. One full rotation advances it by 1 mm — the pitch. With the circular scale divided into 100 parts, measurement to 0.01 mm becomes possible.',
      },
      {
        id: 302,
        componentType: 'SIMULATION',
        displayOrder: 2,
        rendererType: 'SIM_SCREW_GAUGE',
        sourcePage: 22,
        config: { maxLengthMm: 12 },
        parameters: {
          pitch: 1,
          circularDivisions: 100,
          objectLength: 2.53,
          mode: 'explore',
        },
      },
      {
        id: 303,
        componentType: 'EXERCISE',
        displayOrder: 3,
        rendererType: 'SIM_SCREW_GAUGE',
        sourcePage: 22,
        config: { maxLengthMm: 12 },
        parameters: { pitch: 1, circularDivisions: 100, mode: 'practice' },
      },
    ],
  },
  {
    id: 4,
    titleBn: 'পরিমাপের ত্রুটি ও নির্ভুলতা',
    titleEn: 'Error and Accuracy of Measurements',
    components: [
      {
        id: 401,
        componentType: 'EXPLANATION',
        displayOrder: 1,
        sourcePage: 26,
        bodyBn:
          'যে পরিমাপ করছি, তার একটা সীমা আছে — অর্থাৎ পরিমাপে ত্রুটি থাকা খুবই স্বাভাবিক। শুধু সেন্টিমিটারে দাগ কাটা রুলার দিয়ে মাপলে আমাদের অনিশ্চয়তা ±০.৫ সেন্টিমিটার। নিচের পরীক্ষায় দেখো, দৈর্ঘ্যের ছোট ত্রুটি আয়তনের হিসাবে কত বড় হয়ে দাঁড়ায়।',
        bodyEn:
          'Every measurement has a limit, so some error is entirely normal. A ruler marked only in centimetres carries an uncertainty of ±0.5 cm. See below how a small error in length grows when volume is computed.',
      },
      {
        id: 402,
        componentType: 'SIMULATION',
        displayOrder: 2,
        rendererType: 'SIM_ERROR_PROPAGATION',
        sourcePage: 28,
        config: { unit: 'cm', unitBn: 'cm' },
        parameters: {},
      },
    ],
  },
  {
    id: 5,
    titleBn: 'অনিবন্ধিত উপাদানের উদাহরণ',
    titleEn: 'Unregistered Component Example',
    components: [
      {
        id: 501,
        componentType: 'SIMULATION',
        displayOrder: 1,
        // Deliberately not in the registry — demonstrates that an unpublished
        // or misspelled type degrades in place instead of blanking the lesson.
        rendererType: 'SIM_PENDULUM',
        config: {},
        parameters: {},
      },
    ],
  },
]
