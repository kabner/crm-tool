import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Sequence } from './entities/sequence.entity';
import { SequenceStep } from './entities/sequence-step.entity';
import { SequenceEnrollment } from './entities/sequence-enrollment.entity';
import { Contact } from '../crm/entities/contact.entity';
import { SequencesController } from './controllers/sequences.controller';
import { SequencesService } from './services/sequences.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Sequence,
      SequenceStep,
      SequenceEnrollment,
      Contact,
    ]),
  ],
  controllers: [SequencesController],
  providers: [SequencesService],
  exports: [SequencesService],
})
export class SalesModule {}
