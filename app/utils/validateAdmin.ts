'use server'


export const validateAdminCredentials = async (email: string, password: string): Promise<boolean> => {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  return email === adminEmail && password === adminPassword;
}