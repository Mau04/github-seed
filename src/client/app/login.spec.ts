import {TestComponentBuilder, describe, expect, injectAsync, it} from 'angular2/testing';
import {Component, View} from 'angular2/angular2';

// import {Location, Router, RouteRegistry} from 'angular2/router';
// import {SpyLocation} from 'angular2/src/mock/location_mock';
// import {RootRouter} from 'angular2/src/router/router';

import {DOM} from 'angular2/src/core/dom/dom_adapter';
import {LoginApp} from './login';

export function main() {

  describe('LoginApp component', () => {

    // support for testing component that uses Router
    /*beforeEachProviders(() => [
      RouteRegistry,
      DirectiveResolver,
      provide(Location, {useClass: SpyLocation}),
      provide(Router, { useFactory: (registry, location) => { return new RootRouter(registry, location, LoginApp); },
          deps: [RouteRegistry, Location]
      })
    ]);*/

    it('should work', injectAsync([TestComponentBuilder], (tcb: TestComponentBuilder) => {
        return tcb.overrideTemplate(TestComponent, '<div><app></app></div>')
          .createAsync(TestComponent)
          .then((rootTC) => {
            // rootTC.detectChanges();
            let appDOMEl = rootTC.debugElement.componentViewChildren[0].nativeElement;
            expect(DOM.querySelectorAll(appDOMEl, 'div > div > h1')[0].innerHTML).toEqual('Welcome to github-seed');
          });
      }));
  });
}

@Component({selector: 'test-cmp'})
@View({directives: [LoginApp]})
class TestComponent {}
