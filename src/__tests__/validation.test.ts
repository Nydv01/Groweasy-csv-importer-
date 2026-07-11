import { parsePhoneNumber, isValidPhone, extractPhoneNumbers } from '../lib/validation/phone';
import { isValidEmail, extractEmails } from '../lib/validation/email';
import { isValidDate, parseDate } from '../lib/validation/date';
import { sanitizeCrmRecord, hasContactMethod, isEmptyRecord } from '../lib/validation/schema';

describe('Phone Number Validation & Parsing', () => {
  test('should parse Indian numbers correctly', () => {
    expect(parsePhoneNumber('+919876543210')).toEqual({ countryCode: '91', mobile: '9876543210' });
    expect(parsePhoneNumber('919876543210')).toEqual({ countryCode: '91', mobile: '9876543210' });
    expect(parsePhoneNumber('9876543210')).toEqual({ countryCode: '91', mobile: '9876543210' });
  });

  test('should validate correct phone lengths', () => {
    expect(isValidPhone('+919876543210')).toBe(true);
    expect(isValidPhone('abc')).toBe(false);
  });

  test('should extract primary and alternate phones', () => {
    const result = extractPhoneNumbers('+919876543210 / 8877665544');
    expect(result.primary.mobile).toBe('9876543210');
    expect(result.additional).toContain('8877665544');
  });
});

describe('Email Validation & Parsing', () => {
  test('should validate correct email patterns', () => {
    expect(isValidEmail('test@gmail.com')).toBe(true);
    expect(isValidEmail('invalid-email')).toBe(false);
  });

  test('should extract primary and alternate emails', () => {
    const result = extractEmails('test1@gmail.com, test2@yahoo.com');
    expect(result.primary).toBe('test1@gmail.com');
    expect(result.additional).toContain('test2@yahoo.com');
  });
});

describe('Date Normalization', () => {
  test('should parse ISO date strings', () => {
    expect(parseDate('2024-06-01T10:30:00')).toBeTruthy();
  });

  test('should parse Indian date formats DD/MM/YYYY', () => {
    const parsed = parseDate('25/03/2024');
    expect(parsed).toBeTruthy();
    expect(new Date(parsed).getFullYear()).toBe(2024);
  });
});

describe('CRM Record Schema Rules', () => {
  test('should identify invalid records without contact info', () => {
    const validRecord = sanitizeCrmRecord({ email: 'test@gmail.com' });
    const invalidRecord = sanitizeCrmRecord({ name: 'John Doe' }); // no email or mobile
    expect(hasContactMethod(validRecord)).toBe(true);
    expect(hasContactMethod(invalidRecord)).toBe(false);
  });

  test('should identify empty records', () => {
    const empty = sanitizeCrmRecord({});
    expect(isEmptyRecord(empty)).toBe(true);
  });
});
