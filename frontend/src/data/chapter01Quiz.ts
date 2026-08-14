import type { LessonSpec } from '../registry/types'

/**
 * Chapter 1 নমুনা প্রশ্ন, book pp. 29–30, for the offline dev harness.
 *
 * In normal operation these arrive from GET /api/lessons/:id and are graded by
 * the server, which never sends the answer key to the browser. This file exists
 * only so the QuizRunner can be developed and demonstrated without MySQL.
 *
 * Question 4 of the printed six is absent. As printed, its options (ক) and (গ)
 * are both "4.07 cm" — which is also the correct answer. See
 * docs/content/textbook-issues.md.
 */

export const chapter01QuizQuestions = [
  {
    id: 1,
    type: 'MCQ_SINGLE',
    marks: 1,
    prompt: 'কোয়ান্টাম তত্ত্ব প্রথম কে প্রদান করেন?',
    promptEn: 'Who first proposed quantum theory?',
    options: [
      { key: 'ka', text: 'প্ল্যাঙ্ক', textEn: 'Planck' },
      { key: 'kha', text: 'আইনস্টাইন', textEn: 'Einstein' },
      { key: 'ga', text: 'রাদারফোর্ড', textEn: 'Rutherford' },
      { key: 'gha', text: 'হাইজেনবার্গ', textEn: 'Heisenberg' },
    ],
  },
  {
    id: 2,
    type: 'MCQ_SINGLE',
    marks: 1,
    prompt: 'বোজন কার নাম থেকে এসেছে?',
    promptEn: 'Whose name does the boson come from?',
    options: [
      { key: 'ka', text: 'জগদীশচন্দ্র বসু', textEn: 'Jagadish Chandra Bose' },
      { key: 'kha', text: 'সুভাষচন্দ্র বসু', textEn: 'Subhas Chandra Bose' },
      { key: 'ga', text: 'সত্যেন্দ্রনাথ বসু', textEn: 'Satyendra Nath Bose' },
      { key: 'gha', text: 'শরৎচন্দ্র বসু', textEn: 'Sarat Chandra Bose' },
    ],
  },
  {
    id: 3,
    type: 'MCQ_SINGLE',
    marks: 1,
    prompt: 'নিচের কোনটি মৌলিক রাশি নয়?',
    promptEn: 'Which of the following is NOT a base quantity?',
    options: [
      { key: 'ka', text: 'ভর', textEn: 'Mass' },
      { key: 'kha', text: 'তাপ', textEn: 'Heat' },
      { key: 'ga', text: 'তড়িৎ প্রবাহ', textEn: 'Electric current' },
      { key: 'gha', text: 'পদার্থের পরিমাণ', textEn: 'Amount of substance' },
    ],
  },
  {
    id: 5,
    type: 'MCQ_SINGLE',
    marks: 1,
    prompt:
      'রফিক স্কেল দিয়ে একটি পেন্সিলের দৈর্ঘ্য ১৫ cm পরিমাপ করল (চূড়ান্ত ত্রুটি ০.৫ cm)। আপেক্ষিক ত্রুটি কত?',
    promptEn:
      'Rafiq measures a pencil as 15 cm with an absolute error of 0.5 cm. What is the relative error?',
    options: [
      { key: 'ka', text: '১৫.৫%', textEn: '15.5%' },
      { key: 'kha', text: '১৪.৫%', textEn: '14.5%' },
      { key: 'ga', text: '৩.৪৪%', textEn: '3.44%' },
      { key: 'gha', text: '৩.৩৩%', textEn: '3.33%' },
    ],
  },
  {
    id: 6,
    type: 'MCQ_SINGLE',
    marks: 1,
    prompt:
      'একটি ব্লক (৭ cm × ৬ cm × ৪ cm) এবং একটি গোলকের (ব্যাসার্ধ ৩ cm) আয়তনের অনুপাত কত?',
    promptEn:
      'What is the ratio of the volumes of a block (7 x 6 x 4 cm) and a sphere of radius 3 cm?',
    options: [
      { key: 'ka', text: '১ : ০.৬৭৩', textEn: '1 : 0.673' },
      { key: 'kha', text: '১ : ০.০৬৭৩', textEn: '1 : 0.0673' },
      { key: 'ga', text: '১ : ০.৭৬৩', textEn: '1 : 0.763' },
      { key: 'gha', text: '১ : ০.৬৩৭', textEn: '1 : 0.637' },
    ],
  },
]

/**
 * DEVELOPMENT ONLY — never ship this path to students.
 *
 * The real answer key lives in Question.answerConfig on the server and is never
 * sent to the browser. This exists solely so the offline harness can show a
 * result screen. `useLessonSource` uses it only when the API is unreachable.
 *
 * Keys are DERIVED from the book, not printed in it — see the seed.
 */
export const DEV_ANSWER_KEY: Record<
  string,
  { correct: string[]; explanationBn: string; explanationEn: string }
> = {
  '1': {
    correct: ['ka'],
    explanationBn: 'পাঠ্যবই পৃষ্ঠা ৮: ১৯০০ সালে ম্যাক্স প্ল্যাঙ্ক কোয়ান্টাম তত্ত্ব দেন।',
    explanationEn: 'Book p. 8: Max Planck proposed quantum theory in 1900.',
  },
  '2': {
    correct: ['ga'],
    explanationBn: 'পাঠ্যবই পৃষ্ঠা ৮: সত্যেন্দ্রনাথ বসুর নামে বোজন।',
    explanationEn: 'Book p. 8: the boson is named after Satyendra Nath Bose.',
  },
  '3': {
    correct: ['kha'],
    explanationBn: 'টেবিল ১.০১-এ সাতটি মৌলিক রাশির মধ্যে তাপ নেই।',
    explanationEn: 'Table 1.01 lists seven base quantities; heat is not one.',
  },
  '5': {
    correct: ['gha'],
    explanationBn: 'আপেক্ষিক ত্রুটি = ০.৫ ÷ ১৫ × ১০০ = ৩.৩৩%।',
    explanationEn: 'Relative error = 0.5 / 15 x 100 = 3.33%.',
  },
  '6': {
    correct: ['ka'],
    explanationBn: 'ব্লক ১৬৮ cm³, গোলক ১১৩.১ cm³ — অনুপাত ১ : ০.৬৭৩।',
    explanationEn: 'Block 168 cm³, sphere 113.1 cm³ — ratio 1 : 0.673.',
  },
}

export function gradeLocally(responses: Record<string, string>) {
  const results = chapter01QuizQuestions.map((question) => {
    const key = DEV_ANSWER_KEY[String(question.id)]
    const correct = key?.correct.includes(responses[String(question.id)]) ?? false
    return {
      questionId: question.id,
      correct,
      marksAwarded: correct ? question.marks : 0,
      correctKeys: key?.correct ?? [],
      explanationBn: key?.explanationBn,
      explanationEn: key?.explanationEn,
    }
  })
  return {
    score: results.reduce((sum, r) => sum + r.marksAwarded, 0),
    maxScore: chapter01QuizQuestions.reduce((sum, q) => sum + q.marks, 0),
    passMark: 3,
    results,
  }
}

export const chapter01QuizLesson: LessonSpec = {
  id: 6,
  titleBn: 'অধ্যায় মূল্যায়ন',
  titleEn: 'Chapter Assessment',
  components: [
    {
      id: 601,
      componentType: 'QUIZ',
      displayOrder: 1,
      rendererType: 'QUIZ_RUNNER',
      sourcePage: 29,
      config: {
        quizId: 1,
        titleBn: 'প্রথম অধ্যায় — নমুনা প্রশ্ন',
        titleEn: 'Chapter 1 — Sample Questions',
        passMark: 3,
        questions: chapter01QuizQuestions,
      },
      parameters: {},
    },
  ],
}
