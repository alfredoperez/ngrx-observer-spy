import { TestBed } from '@angular/core/testing';

import { Actions } from '@ngrx/effects';
import { provideMockActions } from '@ngrx/effects/testing';
import { getTestScheduler } from 'jasmine-marbles';
import { EMPTY, Observable, of, throwError } from 'rxjs';

import {
  BooksApiActions,
  FindBookPageActions,
} from '@example-app/books/actions';
import { BookEffects } from '@example-app/books/effects';
import { Book } from '@example-app/books/models';
import { GoogleBooksService } from '@example-app/core/services';
import { ObserverSpy } from '@hirez_io/observer-spy';

describe('BookEffects', () => {
  let effects: BookEffects;
  let googleBooksService: any;
  let actions$: Observable<any>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        BookEffects,
        {
          provide: GoogleBooksService,
          useValue: { searchBooks: jest.fn() },
        },
        provideMockActions(() => actions$),
      ],
    });

    effects = TestBed.inject(BookEffects);
    googleBooksService = TestBed.inject(GoogleBooksService);
    actions$ = TestBed.inject(Actions);
  });

  describe('search$', () => {
    it('should return a book.SearchComplete, with the books, on success, after the de-bounce', () => {
      const book1 = { id: '111', volumeInfo: {} } as Book;
      const book2 = { id: '222', volumeInfo: {} } as Book;
      const books = [book1, book2];

      actions$ = of(FindBookPageActions.searchBooks({ query: 'query' }));
      googleBooksService.searchBooks = jest.fn(() => of(books));

      const observerSpy = new ObserverSpy();
      effects
        .search$({ debounce: 30, scheduler: getTestScheduler() })
        .subscribe(observerSpy);

      expect(observerSpy.getLastValue()).toEqual(
        BooksApiActions.searchSuccess({ books })
      );
    });

    it('should return a book.SearchError if the books service throws', () => {
      const error = { message: 'Unexpected Error. Try again later.' };
      actions$ = of(FindBookPageActions.searchBooks({ query: 'query' }));
      googleBooksService.searchBooks = jest.fn(() => throwError(error));

      const observerSpy = new ObserverSpy();
      effects
        .search$({ debounce: 30, scheduler: getTestScheduler() })
        .subscribe(observerSpy);

      expect(observerSpy.getLastValue()).toEqual(
        BooksApiActions.searchFailure({
          errorMsg: error.message,
        })
      );
    });

    it(`should not do anything if the query is an empty string`, () => {
      actions$ = of(FindBookPageActions.searchBooks({ query: '' }));

      const observerSpy = new ObserverSpy();
      effects
        .search$({ debounce: 30, scheduler: getTestScheduler() })
        .subscribe(observerSpy);

      expect(observerSpy.getLastValue()).toBeUndefined();
    });
  });
});
