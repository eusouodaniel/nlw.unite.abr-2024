import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { prisma } from '@/lib/prisma'

export const getEventAttendees = async (app: FastifyInstance) => {
  app.withTypeProvider<ZodTypeProvider>().get(
    '/events/:eventId/attendees',
    {
      schema: {
        tags: ['attendees'],
        summary: 'Get event attendees',
        params: z.object({
          eventId: z.string().uuid(),
        }),
        querystring: z.object({
          query: z.string().nullable(),
          pageIndex: z.string().nullable().default('0').transform(Number),
        }),
        response: {
          200: z.object({
            attendees: z.array(
              z.object({
                id: z.string().uuid(),
                name: z.string(),
                email: z.string().email(),
                checkedInAt: z.date().nullable(),
                createdAt: z.date(),
              }),
            ),
          }),
        },
      },
    },
    async (request, reply) => {
      const { eventId } = request.params
      const { pageIndex, query } = request.query

      const attendees = await prisma.attendee.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
          checkIn: {
            select: {
              createdAt: true,
            },
          },
        },
        where: {
          AND: {
            eventId,
            ...(query ? { name: { contains: query } } : {}),
          },
        },
        skip: pageIndex * 10,
        take: 10,
      })

      return reply.status(200).send({
        attendees: attendees.map((attendee) => {
          return {
            id: attendee.id,
            name: attendee.name,
            email: attendee.email,
            createdAt: attendee.createdAt,
            checkedInAt: attendee.checkIn?.createdAt ?? null,
          }
        }),
      })
    },
  )
}
