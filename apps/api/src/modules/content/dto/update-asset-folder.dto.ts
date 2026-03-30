import { PartialType } from '@nestjs/swagger';
import { CreateAssetFolderDto } from './create-asset-folder.dto';

export class UpdateAssetFolderDto extends PartialType(CreateAssetFolderDto) {}
