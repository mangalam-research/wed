/**
 * @module dashboard
 * @desc A dashboard for demos.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
import { platformBrowserDynamic } from "@angular/platform-browser-dynamic";

import { AppModule } from "./dashboard/app.module";

platformBrowserDynamic().bootstrapModule(AppModule);
