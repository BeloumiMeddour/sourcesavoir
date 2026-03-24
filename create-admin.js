import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

(async () => {
  try {
    const hashedPassword = await bcrypt.hash('Admin123', 10);
    const user = await prisma.user.upsert({
      where: { email: 'admin@lacite.ca' },
      update: { password: hashedPassword, role: 'admin' },
      create: {
        email: 'admin@lacite.ca',
        password: hashedPassword,
        role: 'admin',
        nom: 'Admin',
        prenom: 'Lacite'
      }
    });
    console.log('✅ Compte admin créé/mis à jour:', user.email, '| Rôle:', user.role);
  } catch (error) {
    console.error('Erreur:', error.message);
  } finally {
    await prisma.$disconnect();
  }
})();
