import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { prisma } from '@/lib/prisma'
import { BadRequestError } from './_errors/bad-request-error'
import { env } from '@/env'

export const getAttendeeBadge = async (app: FastifyInstance) => {
  app.withTypeProvider<ZodTypeProvider>().get(
    '/attendees/:attendeeId/badge',
    {
      schema: {
        tags: ['attendees'],
        summary: 'Get an attendee badge',
        params: z.object({
          attendeeId: z.string().uuid(),
        }),
        response: {
          200: z.object({
            badge: z.object({
              name: z.string(),
              email: z.string().email(),
              eventTitle: z.string(),
              checkInURL: z
                .string()
                .url()
                .describe('Check-in URL used to generate QRCode'),
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
      const { attendeeId } = request.params

      const attendee = await prisma.attendee.findUnique({
        select: {
          name: true,
          email: true,
          event: {
            select: {
              title: true,
            },
          },
        },
        where: {
          id: attendeeId,
        },
      })

      if (!attendee) {
        throw new BadRequestError('Attendee not found.')
      }

      const checkInURL = new URL(
        `/attendees/${attendeeId}/check-in`,
        env.API_BASE_URL,
      ).toString()

      return reply.status(200).send({
        badge: {
          name: attendee.name,
          email: attendee.email,
          eventTitle: attendee.event.title,
          checkInURL,
        },
      })
    },
  )
}
