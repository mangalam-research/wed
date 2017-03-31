/**
 * A prototype application for the Meaning Mapper.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
import { platformBrowserDynamic } from "@angular/platform-browser-dynamic";

import { AppModule } from "./mmwp/app.module";

// tslint:disable-next-line:no-floating-promises
platformBrowserDynamic().bootstrapModule(AppModule);
