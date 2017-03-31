import { NgModule } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { BrowserModule } from "@angular/platform-browser";

import { AppRoutingModule } from "../dashboard/app-routing.module";
import { AppComponent } from "../dashboard/app.component";
import { ChunksService } from "../dashboard/chunks.service";
import { ClearStoreComponent } from "../dashboard/clear-store.component";
import { ConfirmService } from "../dashboard/confirm.service";
import { ControlComponent } from "../dashboard/control.component";
import { MetadataDetailsComponent,
       } from "../dashboard/metadata-details.component";
import { MetadataComponent } from "../dashboard/metadata.component";
import { MetadataService } from "../dashboard/metadata.service";
import { MetasService } from "../dashboard/metas.service";
import { ModesService } from "../dashboard/modes.service";
import { PackDetailsComponent } from "../dashboard/pack-details.component";
import { PacksComponent } from "../dashboard/packs.component";
import { PacksService } from "../dashboard/packs.service";
import { ProcessingComponent } from "../dashboard/processing.component";
import { ProcessingService } from "../dashboard/processing.service";
import { SchemaDetailsComponent } from "../dashboard/schema-details.component";
import { SchemasComponent } from "../dashboard/schemas.component";
import { SchemasService } from "../dashboard/schemas.service";
import { UploadComponent } from "../dashboard/upload.component";
import { XMLFileDetailsComponent,
       } from "../dashboard/xml-file-details.component";
import { XMLFilesComponent } from "../dashboard/xml-files.component";
import { XMLFilesService } from "../dashboard/xml-files.service";
import { XMLTransformService } from "../dashboard/xml-transform.service";

import { ConcordanceTransformService } from "./concordance-transform.service";

// tslint:disable-next-line:no-stateless-class
@NgModule({
  imports: [
    BrowserModule,
    FormsModule,
    AppRoutingModule,
  ],
  declarations: [
    AppComponent,
    ClearStoreComponent,
    XMLFilesComponent,
    PacksComponent,
    PackDetailsComponent,
    XMLFileDetailsComponent,
    ProcessingComponent,
    SchemasComponent,
    SchemaDetailsComponent,
    UploadComponent,
    MetadataComponent,
    MetadataDetailsComponent,
    ControlComponent,
  ],
  providers: [
    ConfirmService,
    ChunksService,
    XMLFilesService,
    PacksService,
    ProcessingService,
    MetasService,
    ModesService,
    SchemasService,
    MetadataService,
    { provide: XMLTransformService,
      useClass: ConcordanceTransformService,
      multi: true },
  ],
  bootstrap: [ AppComponent ],
})
export class AppModule {
  constructor(modes: ModesService) {
    modes.addMode("mmwpa-mode", "mmwp/mmwpa-mode/mmwpa-mode");
  }
}
