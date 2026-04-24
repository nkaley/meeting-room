import { IsEmail, IsString, Length, Matches, MinLength } from 'class-validator';

export class RegisterDto {
  @IsEmail({}, { message: 'Укажите корректный email' })
  email!: string;

  @IsString({ message: 'Пароль обязателен' })
  @MinLength(8, { message: 'Пароль должен содержать минимум 8 символов' })
  password!: string;

  @IsString({ message: 'Имя обязательно' })
  @MinLength(1, { message: 'Имя обязательно' })
  firstName!: string;

  @IsString({ message: 'Фамилия обязательна' })
  @MinLength(1, { message: 'Фамилия обязательна' })
  lastName!: string;
}

export class VerifyEmailDto {
  @IsEmail({}, { message: 'Укажите корректный email' })
  email!: string;

  @IsString({ message: 'Код обязателен' })
  @Length(6, 6, { message: 'Код должен содержать 6 цифр' })
  @Matches(/^\d{6}$/, { message: 'Код должен содержать 6 цифр' })
  code!: string;
}

export class ResendCodeDto {
  @IsEmail({}, { message: 'Укажите корректный email' })
  email!: string;
}

export class LoginDto {
  @IsEmail({}, { message: 'Укажите корректный email' })
  email!: string;

  @IsString({ message: 'Пароль обязателен' })
  password!: string;
}

export class RequestPasswordResetDto {
  @IsEmail({}, { message: 'Укажите корректный email' })
  email!: string;
}

export class ResetPasswordDto {
  @IsEmail({}, { message: 'Укажите корректный email' })
  email!: string;

  @IsString({ message: 'Код обязателен' })
  @Length(6, 6, { message: 'Код должен содержать 6 цифр' })
  @Matches(/^\d{6}$/, { message: 'Код должен содержать 6 цифр' })
  code!: string;

  @IsString({ message: 'Пароль обязателен' })
  @MinLength(8, { message: 'Пароль должен содержать минимум 8 символов' })
  newPassword!: string;
}
