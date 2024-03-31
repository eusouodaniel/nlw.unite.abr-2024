import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { prisma } from '@/lib/prisma'
import { BadRequestError } from './_errors/bad-request-error'
import { createSlug } from '@/utils/create-slug'

export const createEvent = async (app: FastifyInstance) => {
  app.withTypeProvider<ZodTypeProvider>().post(
    '/events',
    {
      schema: {
        tags: ['events'],
        summary: 'Create an event',
        body: z.object({
          title: z.string().min(4),
          details: z.string().nullable(),
          maximumAttendees: z.number().int().positive().nullable(),
        }),
        response: {
          201: z.object({
            eventId: z.string().uuid(),
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
      const { title, details, maximumAttendees } = request.body

      const slug = createSlug(title)

      const eventWithSameSlug = await prisma.event.findUnique({
        where: {
          slug,
        },
      })

      if (eventWithSameSlug) {
        throw new BadRequestError(
          'Another event with same name already exists.',
        )
      }

      const event = await prisma.event.create({
        data: {
          title,
          details,
          slug,
          maximumAttendees,
        },
      })

      return reply.status(201).send({ eventId: event.id })
    },
  )
}
