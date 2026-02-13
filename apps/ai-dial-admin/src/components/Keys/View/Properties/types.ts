import { FieldError } from '@/src/models/error';

export enum RestrictionType {
  ALLOW_ALL = 'allow_all',
  BLOCK_ALL = 'block_all',
  RANGES = 'ranges',
}

export interface IpRange {
  ip?: string | null;
  mask?: number | null;
}

export enum IpRangeProperty {
  IP = 'ip',
  MASK = 'mask',
}

export interface IpRangeError {
  ip: FieldError | null;
  mask: FieldError | null;
}
