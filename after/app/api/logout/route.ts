import { seeOther } from '../../../lib/redirect';
import { clearSession } from '../../../lib/session';

export async function POST() {
  await clearSession();
  return seeOther('/');
}
