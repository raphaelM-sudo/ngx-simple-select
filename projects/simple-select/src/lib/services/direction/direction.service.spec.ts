import { TestBed } from '@angular/core/testing';

import { DirectionService } from './direction.service';

describe('DirectionService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: DirectionService = TestBed.inject(DirectionService);
    expect(service).toBeTruthy();
  });
});
