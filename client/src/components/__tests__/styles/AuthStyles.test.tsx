import { AuthStyles } from '../../styles/AuthStyles';

describe('AuthStyles', () => {
  it('defines the expected style keys', () => {
    // The AuthStyles object should be defined with all expected style properties.
    expect(AuthStyles).toBeDefined();
    expect(AuthStyles).toHaveProperty('container');
    expect(AuthStyles).toHaveProperty('card');
    expect(AuthStyles).toHaveProperty('title');
    expect(AuthStyles).toHaveProperty('input');
    expect(AuthStyles).toHaveProperty('button');
    expect(AuthStyles).toHaveProperty('linkButton');
    expect(AuthStyles).toHaveProperty('linkText');
    expect(AuthStyles).toHaveProperty('error');
  });
});
