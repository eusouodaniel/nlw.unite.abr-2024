import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { prisma } from '@/lib/prisma'
import { BadRequestError } from './_errors/bad-request-error'

export const getEvent = async (app: FastifyInstance) => {
  app.withTypeProvider<ZodTypeProvider>().get(
    '/events/:eventId',
    {
      schema: {
        tags: ['events'],
        summary: 'Get an event',
        params: z.object({
          eventId: z.string().uuid(),
        }),
        response: {
          200: z.object({
            event: z.object({
              id: z.string(),
              title: z.string(),
              details: z.string().nullable(),
              slug: z.string(),
              maximumAttendees: z.number().int().nullable(),
              attendeesAmount: z.number().int(),
            }),
          }),
          400: z
            .object({
              message: z.string(),
            })
            .describe('Bad request'),
        },
      },
    },
    async (request, reply) => {
      const { eventId } = request.params

      const event = await prisma.event.findUnique({
        select: {
          id: true,
          details: true,
          title: true,
          slug: true,
          maximumAttendees: true,
          _count: {
            select: {
              attendees: true,
            },
          },
        },
        where: {
          id: eventId,
        },
      })

      if (!event) {
        throw new BadRequestError('Event not found.')
      }

      return reply.status(200).send({
        event: {
          id: event.id,
          title: event.title,
          slug: event.slug,
          details: event.details,
          maximumAttendees: event.maximumAttendees,
          attendeesAmount: event._count.attendees,
        },
      })
    },
  )
}
