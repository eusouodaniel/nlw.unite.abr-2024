import { prisma } from '@/lib/prisma'

async function seed() {
  await prisma.event.create({
    data: {
      id: 'E56E11DE-975C-43DA-9FD4-CB008A96D92C',
      title: 'Unite Summit',
      slug: 'unite-summit',
      details: 'Um evento para devs.',
      maximumAttendees: 120,
    },
  })
}

seed().then(() => {
  prisma.$disconnect()
  console.log('Database seeded!')
})
