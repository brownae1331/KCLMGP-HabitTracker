import { SharedStyles } from '../../styles/SharedStyles';

describe('SharedStyles', () => {
  it('provides the expected shared style keys', () => {
    expect(SharedStyles).toBeDefined();
    expect(SharedStyles).toHaveProperty('input');
    expect(SharedStyles).toHaveProperty('button');
    expect(SharedStyles).toHaveProperty('addButtonContainer');
    expect(SharedStyles).toHaveProperty('titleContainer');
  });
});
