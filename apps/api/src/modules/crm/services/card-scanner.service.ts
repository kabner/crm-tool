import { Injectable, BadRequestException } from '@nestjs/common';

export interface ScannedCard {
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  companyName: string | null;
  jobTitle: string | null;
}

@Injectable()
export class CardScannerService {
  async scanCard(imageBuffer: Buffer): Promise<ScannedCard> {
    // Dynamic import tesseract.js to avoid build issues
    const Tesseract = await import('tesseract.js');
    const {
      data: { text },
    } = await Tesseract.recognize(imageBuffer, 'eng');

    if (!text || text.trim().length === 0) {
      throw new BadRequestException(
        'Could not extract any text from the image. Please try a clearer photo.',
      );
    }

    return this.parseBusinessCard(text);
  }

  parseBusinessCard(text: string): ScannedCard {
    const lines = text
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    // Extract email
    const emailMatch = text.match(/[\w.+-]+@[\w.-]+\.\w{2,}/);
    const email = emailMatch ? emailMatch[0].toLowerCase() : null;

    // Extract phone — various formats
    const phoneMatch = text.match(
      /(?:\+?1?\s*[-.]?\s*)?(?:\(?\d{3}\)?[\s.-]?)?\d{3}[\s.-]?\d{4}/,
    );
    const phone = phoneMatch ? phoneMatch[0].replace(/[^\d+]/g, '') : null;

    // Extract name — typically first non-email, non-phone, non-URL line that looks like a name
    // Heuristic: first line with 2-3 words, all capitalized first letter, no special chars
    let firstName: string | null = null;
    let lastName: string | null = null;
    for (const line of lines) {
      if (
        line.includes('@') ||
        line.match(/\d{3}/) ||
        line.includes('www') ||
        line.includes('http')
      )
        continue;
      const words = line.split(/\s+/);
      if (
        words.length >= 2 &&
        words.length <= 4 &&
        words.every((w) => /^[A-Z]/.test(w))
      ) {
        firstName = words[0] ?? null;
        lastName = words.slice(1).join(' ') || null;
        break;
      }
    }

    // Extract company — look for Inc, LLC, Corp, Ltd, Co, or the line with the domain
    let companyName: string | null = null;
    for (const line of lines) {
      if (line === `${firstName} ${lastName}`) continue;
      if (
        /\b(Inc|LLC|Corp|Ltd|Co|Company|Group|Partners|Solutions|Technologies|Services)\b/i.test(
          line,
        )
      ) {
        companyName = line;
        break;
      }
    }
    // Fallback: use email domain as company hint
    if (!companyName && email) {
      const domain = email.split('@')[1];
      if (
        domain &&
        !['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com'].includes(
          domain,
        )
      ) {
        const domainName = domain.split('.')[0] ?? '';
        companyName =
          domainName.charAt(0).toUpperCase() + domainName.slice(1);
      }
    }

    // Extract job title — common title keywords
    let jobTitle: string | null = null;
    for (const line of lines) {
      if (line === `${firstName} ${lastName}` || line === companyName) continue;
      if (
        /\b(CEO|CTO|CFO|COO|VP|Director|Manager|Engineer|Developer|Designer|Consultant|President|Founder|Partner|Associate|Analyst|Coordinator|Specialist|Head|Lead|Senior|Junior|Chief)\b/i.test(
          line,
        )
      ) {
        jobTitle = line;
        break;
      }
    }

    return { firstName, lastName, email, phone, companyName, jobTitle };
  }
}
