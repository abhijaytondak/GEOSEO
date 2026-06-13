import { BadRequestException, Body, Controller, Get, Inject, Param, Post, Put } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import type { Workspace } from "@geoseo/types";
import { WorkspaceStore } from "./workspace.service";

@ApiTags("workspaces")
@Controller("workspaces")
export class WorkspaceController {
  constructor(@Inject(WorkspaceStore) private readonly store: WorkspaceStore) {}

  @Get()
  list() {
    return { workspaces: this.store.list() };
  }

  @Post()
  create(@Body() body: { name?: string; domain?: string; industry?: string }) {
    if (!body?.name?.trim() || !body?.domain?.trim()) {
      throw new BadRequestException("name and domain are required");
    }
    return this.store.create({ name: body.name, domain: body.domain, industry: body.industry });
  }

  @Get(":id")
  get(@Param("id") id: string) {
    return this.store.get(id);
  }

  @Put(":id")
  update(@Param("id") id: string, @Body() body: Partial<Workspace>) {
    return this.store.update(id, body ?? {});
  }
}
