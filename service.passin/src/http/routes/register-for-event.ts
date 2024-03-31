import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { prisma } from '@/lib/prisma'
import { BadRequestError } from './_errors/bad-request-error'

export const registerForEvent = async (app: FastifyInstance) => {
  app.withTypeProvider<ZodTypeProvider>().post(
    '/events/:eventId/register',
    {
      schema: {
        tags: ['attendees'],
        summary: 'Register an attendee',
        body: z.object({
          name: z.string().min(4),
          email: z.string().email(),
        }),
        params: z.object({
          eventId: z.string().uuid(),
        }),
        response: {
          201: z.object({
            attendeeId: z.number(),
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
      const { name, email } = request.body

      const attendeeFromEmail = await prisma.attendee.findUnique({
        where: {
          eventId_email: {
            eventId,
            email,
          },
        },
      })

      if (attendeeFromEmail) {
        throw new BadRequestError(
          'This e-mails is already registered for this event.',
        )
      }

      const event = await prisma.event.findUnique({
        select: {
          maximumAttendees: true,
          _count: {
            select: {
              attendees: {
                where: {
                  checkIn: {
                    isNot: null,
                  },
                },
              },
            },
          },
        },
        where: {
          id: eventId,
        },
      })

      if (
        event?.maximumAttendees &&
        event._count.attendees >= event.maximumAttendees
      ) {
        throw new BadRequestError(
          'The maximum number of attendees for this event has been reached.',
        )
      }

      const attendee = await prisma.attendee.create({
        data: {
          name,
          email,
          eventId,
        },
      })

      return reply.status(201).send({ attendeeId: attendee.id })
    },
  )
}
