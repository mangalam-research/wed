import { Router } from "@angular/router";

import { DBService } from "./db.service";
import { ProcessingService } from "./processing.service";
import { RecordCommon } from "./record-common";
import { safeConfirm, triggerDownload } from "./util";

export abstract class GenericRecordsComponent<RecordType extends RecordCommon,
RecordService extends DBService<any, any>> {
  records: RecordType[];

  constructor(private readonly router: Router,
              protected readonly files: RecordService,
              private readonly processing: ProcessingService,
              protected readonly detailRoutePrefix: string) {}

  ngAfterViewInit(): void {
    this.files.change.subscribe(() => this.refresh());
    this.refresh();
  }

  protected refresh(): void {
    this.files.getRecords().then((records: RecordType[]) => {
      this.records = records;
    });
  };

  del(record: RecordType): void {
    const handleResponse = (result: boolean) => {
      if (!result) {
        return;
      }
      this.files.deleteRecord(record);
    };

    safeConfirm(`Do you really want to delete "${record.name}"?`)
      .then(handleResponse);
  };

  protected abstract getDownloadData(record: RecordType): Promise<string>;

  download(record: RecordType): void {
    this.getDownloadData(record).then((data) => {
      triggerDownload(record.name, data);
    });
  };

  upload(record: RecordType, event: Event): void {
    const target = (event.target as HTMLInputElement);
    const filesToLoad = target.files;
    if (!filesToLoad) {
      return;
    }

    switch (filesToLoad.length) {
    case 0:
      return;
    case 1:
      this.processing.start(1);
        this.files.safeLoadFromFile(filesToLoad[0], record).then(() => {
        this.processing.stop();
        target.value = "";
      });
      break;
    default:
      throw new Error("internal error: the upload econtrol cannot " +
                      "be used for multiple files");
    }
  };

  showDetails(record: RecordType): void {
    this.router.navigate([this.detailRoutePrefix, record.id]);
  }
}
