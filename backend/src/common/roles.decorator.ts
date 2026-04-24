import { SetMetadata } from '@nestjs/common';
import { AppRole, ROLES_KEY } from './roles';

export const Roles = (...roles: AppRole[]) => SetMetadata(ROLES_KEY, roles);
