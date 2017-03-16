import { NgModule } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { BrowserModule } from "@angular/platform-browser";

import { AppRoutingModule } from "./app-routing.module";
import { AppComponent } from "./app.component";
import { ChunksService } from "./chunks.service";
import { ClearStoreComponent } from "./clear-store.component";
import { ConfirmService } from "./confirm.service";
import { ControlComponent } from "./control.component";
import { MetadataDetailsComponent } from "./metadata-details.component";
import { MetadataComponent } from "./metadata.component";
import { MetadataService } from "./metadata.service";
import { MetasService } from "./metas.service";
import { ModesService } from "./modes.service";
import { PackDetailsComponent } from "./pack-details.component";
import { PacksComponent } from "./packs.component";
import { PacksService } from "./packs.service";
import { ProcessingComponent } from "./processing.component";
import { ProcessingService } from "./processing.service";
import { SchemaDetailsComponent } from "./schema-details.component";
import { SchemasComponent } from "./schemas.component";
import { SchemasService } from "./schemas.service";
import { UploadComponent } from "./upload.component";
import { XMLFileDetailsComponent } from "./xml-file-details.component";
import { XMLFilesComponent } from "./xml-files.component";
import { XMLFilesService } from "./xml-files.service";

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
  ],
  bootstrap: [ AppComponent ],
})
export class AppModule { }
