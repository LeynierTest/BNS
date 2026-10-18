// Se ejecuta en cada worker antes de cargar los módulos de la app:
// PrismaService y AuthModule leen estas variables al construirse, y
// dotenv no sobrescribe las que ya existen.
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
process.env.JWT_SECRET = 'e2e-jwt-secret';
process.env.FRONTEND_ORIGIN = 'http://localhost:5173';

// MailService exige configuración SMTP para arrancar; en pruebas se usan
// valores ficticios para no enviar nunca correos reales.
process.env.SMTP_HOST = '127.0.0.1';
process.env.SMTP_PORT = '2525';
process.env.SMTP_USER = 'e2e';
process.env.SMTP_PASSWORD = 'e2e';
process.env.SMTP_FROM = 'e2e@bns.test';
