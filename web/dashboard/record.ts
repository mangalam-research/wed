import { Metadata } from "./metadata";
import { Pack } from "./pack";
import { Schema } from "./schema";
import { XMLFile } from "./xml-file";

export type Record = XMLFile | Pack | Schema | Metadata;
