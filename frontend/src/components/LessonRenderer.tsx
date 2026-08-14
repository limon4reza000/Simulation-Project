import { useCallback } from 'react'
import { resolveRenderer } from '../registry/componentRegistry'
import type { ActivityEvent, LessonSpec, Language } from '../registry/types'

/**
 * Renders a lesson from its component list.
 *
 * Note what this file does *not* contain: any mention of calipers, physics,
 * measurement, or Chapter 1. It walks components in `displayOrder` and defers
 * to the registry. That is what makes a new instrument free at this layer.
 */

interface Props {
  lesson: LessonSpec
  language?: Language
  onActivity?: (event: ActivityEvent) => void
}

export default function LessonRenderer({
  lesson,
  language = 'BN',
  onActivity,
}: Props) {
  /**
   * Stamps each event with its curriculum location. A renderer reports what the
   * student did; only this layer knows which component and simulation that was,
   * which keeps renderers free of any lesson awareness.
   */
  const activityFor = useCallback(
    (component: { id: number; simulationId?: number }) =>
      (event: ActivityEvent) =>
        onActivity?.({
          ...event,
          componentId: component.id,
          simulationId: component.simulationId,
        }),
    [onActivity],
  )

  const ordered = [...lesson.components].sort(
    (a, b) => a.displayOrder - b.displayOrder,
  )

  return (
    <article className="lesson">
      <h2 className="lesson__title">
        {language === 'BN' ? lesson.titleBn : lesson.titleEn}
      </h2>

      {ordered.map((component) => {
        if (
          component.componentType === 'EXPLANATION' ||
          component.componentType === 'DIAGRAM'
        ) {
          const body =
            language === 'BN' ? component.bodyBn : (component.bodyEn ?? component.bodyBn)
          return (
            <section key={component.id} className="lesson__prose">
              <p>{body}</p>
              {component.sourcePage !== undefined && (
                <cite className="lesson__source">
                  {language === 'BN' ? 'পাঠ্যবই পৃষ্ঠা' : 'Textbook page'}{' '}
                  {component.sourcePage}
                </cite>
              )}
            </section>
          )
        }

        const Renderer = resolveRenderer(component.rendererType)

        if (!Renderer) {
          // A published lesson referencing an unregistered type is a content
          // bug, not a crash. Fail visibly in place rather than blanking the
          // page, so an author can see exactly which component is broken.
          return (
            <section key={component.id} className="lesson__missing">
              <strong>
                {language === 'BN'
                  ? 'এই উপাদানটি এখনো যুক্ত করা হয়নি'
                  : 'This component is not registered yet'}
              </strong>
              <code>{component.rendererType ?? component.componentType}</code>
            </section>
          )
        }

        return (
          <section key={component.id} className="lesson__component">
            <Renderer
              config={component.config ?? {}}
              parameters={component.parameters ?? {}}
              language={language}
              onActivity={activityFor(component)}
            />
            {component.sourcePage !== undefined && (
              <cite className="lesson__source">
                {language === 'BN' ? 'পাঠ্যবই পৃষ্ঠা' : 'Textbook page'}{' '}
                {component.sourcePage}
              </cite>
            )}
          </section>
        )
      })}
    </article>
  )
}
