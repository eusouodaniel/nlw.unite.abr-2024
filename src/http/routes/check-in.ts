import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { prisma } from '@/lib/prisma'
import { ConflictError } from './_errors/conflict-error'

export const checkIn = async (app: FastifyInstance) => {
  app.withTypeProvider<ZodTypeProvider>().post(
    '/attendees/:attendeeId/check-in',
    {
      schema: {
        tags: ['check-ins'],
        summary: 'Check-in attendee',
        params: z.object({
          attendeeId: z.string().uuid(),
        }),
        response: {
          201: z.null(),
          409: z
            .object({ message: z.string() })
            .describe('Attendee already checked-in before.'),
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

      const attendeeCheckIn = await prisma.checkIn.findUnique({
        where: {
          attendeeId,
        },
      })

      if (attendeeCheckIn) {
        throw new ConflictError('Attendee event with same name already exists.')
      }

      await prisma.checkIn.create({
        data: {
          attendeeId,
        },
      })

      return reply.status(201).send()
    },
  )
}
