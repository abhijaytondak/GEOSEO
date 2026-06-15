import { Body, Controller, Get, Inject, Put } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { validateBody } from "../common/validation";
import { BrandLibrarySchema } from "../common/schemas";
import { BrandLibraryStore, type BrandLibrary } from "./brand-library.service";
import { AuditStore } from "./audit.service";

@ApiTags("brand")
@Controller("brand-library")
export class BrandLibraryController {
  constructor(
    @Inject(BrandLibraryStore) private readonly library: BrandLibraryStore,
    @Inject(AuditStore) private readonly audit: AuditStore,
  ) {}

  @Get()
  get() {
    return { library: this.library.get(), strength: this.library.strength() };
  }

  /** Full-replace upsert of the structured brand library (products / personas / proof). */
  @Put()
  replace(@Body(validateBody(BrandLibrarySchema)) body: Partial<BrandLibrary>) {
    const library = this.library.replace(body, new Date().toISOString());
    this.audit.record("update", "brand", "library");
    return { library, strength: this.library.strength() };
  }
}
