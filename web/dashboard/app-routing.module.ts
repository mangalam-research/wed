import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";

import { ControlComponent } from "./control.component";
import { MetadataDetailsComponent } from "./metadata-details.component";
import { MetadataComponent } from "./metadata.component";
import { PackDetailsComponent } from "./pack-details.component";
import { PacksComponent } from "./packs.component";
import * as paths from "./route-paths";
import { SchemaDetailsComponent } from "./schema-details.component";
import { SchemasComponent } from "./schemas.component";
import { XMLFileDetailsComponent } from "./xml-file-details.component";
import { XMLFilesComponent } from "./xml-files.component";

const routes: Routes = [
  { path: "", redirectTo: "/xml", pathMatch: "full" },
  { path: paths.XML_FILES,  component: XMLFilesComponent },
  { path: paths.XML_FILE_DETAILS, component: XMLFileDetailsComponent },
  { path: paths.PACKS,  component: PacksComponent },
  { path: paths.PACK_DETAILS,  component: PackDetailsComponent },
  { path: paths.PACK_NEW,  component: PackDetailsComponent },
  { path: paths.SCHEMAS,  component: SchemasComponent },
  { path: paths.SCHEMA_DETAILS,  component: SchemaDetailsComponent },
  { path: paths.METADATA,  component: MetadataComponent },
  { path: paths.METADATA_DETAILS, component: MetadataDetailsComponent },
  { path: paths.CONTROL, component: ControlComponent },
];
@NgModule({
  imports: [ RouterModule.forRoot(routes, {
    useHash: true,
  }) ],
  exports: [ RouterModule ],
})
export class AppRoutingModule {}
