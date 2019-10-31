import { TestBed } from '@angular/core/testing';

import { ParentService } from './parent.service';

describe('ParentService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: ParentService<any> = TestBed.get(ParentService);
    expect(service).toBeTruthy();
  });
});
