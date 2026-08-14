// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, cleanup, fireEvent, waitFor } from '@testing-library/react'
import LessonRenderer from '../LessonRenderer'
import { chapter01QuizLesson, gradeLocally } from '../../data/chapter01Quiz'

afterEach(cleanup)

/**
 * The QuizRunner is driven through LessonRenderer, because the submit handler
 * is injected there — testing the pair is testing the real path.
 */

function renderQuiz(onQuizSubmit = vi.fn()) {
  render(
    <LessonRenderer
      lesson={chapter01QuizLesson}
      language="BN"
      onQuizSubmit={onQuizSubmit}
    />,
  )
  return onQuizSubmit
}

describe('QuizRunner', () => {
  it('renders every seeded question with its options', () => {
    renderQuiz()
    expect(screen.getByText(/কোয়ান্টাম তত্ত্ব প্রথম কে প্রদান করেন/)).toBeDefined()
    expect(screen.getByText('প্ল্যাঙ্ক')).toBeDefined()
    // Five of the six printed MCQs; question 4 is withheld deliberately.
    expect(screen.getAllByRole('radio')).toHaveLength(20)
  })

  it('disables submit until every question is answered', () => {
    renderQuiz()
    const submit = screen.getByRole('button', { name: 'জমা দাও' })
    expect(submit.hasAttribute('disabled')).toBe(true)

    for (const radio of screen.getAllByRole('radio').slice(0, 4)) {
      fireEvent.click(radio)
    }
    // Still incomplete — only the first question has been answered.
    expect(screen.getByRole('button', { name: 'জমা দাও' }).hasAttribute('disabled')).toBe(
      true,
    )
  })

  it('submits the chosen responses and shows the score', async () => {
    const onSubmit = vi.fn().mockImplementation(async (_quizId, responses) => {
      const local = gradeLocally(responses as Record<string, string>)
      return {
        ...local,
        results: local.results.map((r) => ({ ...r, explanation: r.explanationBn })),
      }
    })
    renderQuiz(onSubmit)

    // Answer everything correctly: ka, ga, kha, gha, ka.
    for (const [questionId, key] of [
      ['1', 'ka'],
      ['2', 'ga'],
      ['3', 'kha'],
      ['5', 'gha'],
      ['6', 'ka'],
    ]) {
      const radio = document.querySelector(
        `input[name="q${questionId}"][value="${key}"]`,
      ) as HTMLInputElement
      fireEvent.click(radio)
    }

    fireEvent.click(screen.getByRole('button', { name: 'জমা দাও' }))

    await waitFor(() => {
      expect(screen.getByText('৫ / ৫ নম্বর')).toBeDefined()
    })
    expect(screen.getByText('উত্তীর্ণ হয়েছ!')).toBeDefined()
    expect(onSubmit).toHaveBeenCalledOnce()
    expect(onSubmit.mock.calls[0][1]).toEqual({
      '1': 'ka',
      '2': 'ga',
      '3': 'kha',
      '5': 'gha',
      '6': 'ka',
    })
  })

  it('shows the explanation after submitting, not before', async () => {
    const onSubmit = vi.fn().mockImplementation(async (_q, responses) => {
      const local = gradeLocally(responses as Record<string, string>)
      return {
        ...local,
        results: local.results.map((r) => ({ ...r, explanation: r.explanationBn })),
      }
    })
    renderQuiz(onSubmit)

    expect(screen.queryByText(/ম্যাক্স প্ল্যাঙ্ক কোয়ান্টাম তত্ত্ব/)).toBeNull()

    for (const [questionId, key] of [
      ['1', 'kha'],
      ['2', 'ga'],
      ['3', 'kha'],
      ['5', 'gha'],
      ['6', 'ka'],
    ]) {
      fireEvent.click(
        document.querySelector(
          `input[name="q${questionId}"][value="${key}"]`,
        ) as HTMLInputElement,
      )
    }
    fireEvent.click(screen.getByRole('button', { name: 'জমা দাও' }))

    await waitFor(() => {
      expect(screen.getByText('৪ / ৫ নম্বর')).toBeDefined()
    })
    expect(screen.getByText(/ম্যাক্স প্ল্যাঙ্ক কোয়ান্টাম তত্ত্ব/)).toBeDefined()
  })

  it('locks the options once submitted', async () => {
    const onSubmit = vi.fn().mockResolvedValue({
      score: 0,
      maxScore: 5,
      passMark: 3,
      results: [],
    })
    renderQuiz(onSubmit)

    for (const questionId of ['1', '2', '3', '5', '6']) {
      fireEvent.click(
        document.querySelector(
          `input[name="q${questionId}"][value="ka"]`,
        ) as HTMLInputElement,
      )
    }
    fireEvent.click(screen.getByRole('button', { name: 'জমা দাও' }))

    await waitFor(() => {
      expect(screen.getByText('আরেকবার দেখে নাও')).toBeDefined()
    })
    for (const radio of screen.getAllByRole('radio')) {
      expect((radio as HTMLInputElement).disabled).toBe(true)
    }
  })

  it('surfaces a submission failure instead of pretending it scored', async () => {
    const onSubmit = vi.fn().mockRejectedValue(new Error('network down'))
    renderQuiz(onSubmit)

    for (const questionId of ['1', '2', '3', '5', '6']) {
      fireEvent.click(
        document.querySelector(
          `input[name="q${questionId}"][value="ka"]`,
        ) as HTMLInputElement,
      )
    }
    fireEvent.click(screen.getByRole('button', { name: 'জমা দাও' }))

    await waitFor(() => {
      expect(screen.getByText('জমা দেওয়া যায়নি')).toBeDefined()
    })
    expect(screen.queryByText(/নম্বর$/)).toBeNull()
  })
})

describe('local dev grading', () => {
  it('matches the answer keys derived from the book', () => {
    const perfect = gradeLocally({ '1': 'ka', '2': 'ga', '3': 'kha', '5': 'gha', '6': 'ka' })
    expect(perfect.score).toBe(5)
    expect(perfect.maxScore).toBe(5)
  })

  it('counts an unanswered question as wrong', () => {
    const partial = gradeLocally({ '1': 'ka' })
    expect(partial.score).toBe(1)
    expect(partial.results).toHaveLength(5)
  })
})
