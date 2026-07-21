const { User, sequelize } = require('../src/models');

function disposableIdentity() {
  if (process.env.NODE_ENV !== 'test' || process.env.ALLOW_DISPOSABLE_SEED !== 'YES') {
    throw new Error('create-admin is restricted to an acknowledged disposable test runtime');
  }
  const database = new URL(process.env.DATABASE_URL || '');
  if (!['127.0.0.1', 'localhost', '::1'].includes(database.hostname)) throw new Error('create-admin requires a loopback database');
  const email = String(process.env.PROVISION_ADMIN_EMAIL || process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  const password = String(process.env.PROVISION_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD || '');
  if (!email || password.length < 12) throw new Error('Acceptance administrator credentials are incomplete');
  return { email, password };
}

async function main() {
  const { email, password } = disposableIdentity();
  const existing = await User.findOne({ where: { email } });
  if (existing) {
    existing.password = password;
    existing.role = 'admin';
    existing.isActive = true;
    await existing.save();
  } else {
    await User.create({ username: 'runtime-admin', email, password, firstName: 'Runtime', lastName: 'Acceptance', role: 'admin', isActive: true });
  }
  console.log(`Provisioned disposable administrator ${email}`);
}

main().catch((error) => { console.error(error.message); process.exitCode = 1; }).finally(() => sequelize.close());
