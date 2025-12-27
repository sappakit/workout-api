import { SetMetadata } from '@nestjs/common';

export const SERIALIZE_DTO_KEY = 'serializeDto';

export function Serialize(dto: any) {
  return SetMetadata(SERIALIZE_DTO_KEY, dto);
}
