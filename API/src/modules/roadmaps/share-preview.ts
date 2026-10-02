import { Controller, Get, Header, Inject, Param, ParseUUIDPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Public } from '../auth/auth.guard.js';
import { RoadmapsService } from './roadmaps.service.js';

export function escapeHtml(value: string): string {
  return value.replace(
    /[&<>'\"]/g,
    (character) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character]!,
  );
}

@Public()
@Controller('share')
export class SharePreviewController {
  constructor(
    @Inject(RoadmapsService) private readonly service: RoadmapsService,
    private readonly config: ConfigService,
  ) {}

  @Get('roadmaps/:id')
  @Header('Content-Type', 'text/html; charset=utf-8')
  async roadmap(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    const roadmap = await this.service.get(id);
    const appUrl = this.config.getOrThrow<string>('PUBLIC_APP_URL');
    const url = `${appUrl}/roadmaps/${roadmap.id}`;
    const title = `${roadmap.title} · BreadCrumbs`;
    const description =
      roadmap.description || `Trilha de conhecimento criada por ${roadmap.authorName}.`;
    const image = `${appUrl}/share-card.png`;

    return `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8">
    <title>${escapeHtml(title)}</title>
    <meta name="description" content="${escapeHtml(description)}">
    <meta property="og:site_name" content="BreadCrumbs">
    <meta property="og:type" content="article">
    <meta property="og:title" content="${escapeHtml(title)}">
    <meta property="og:description" content="${escapeHtml(description)}">
    <meta property="og:url" content="${escapeHtml(url)}">
    <meta property="og:image" content="${escapeHtml(image)}">
    <meta property="og:image:type" content="image/png">
    <meta property="og:image:width" content="1536">
    <meta property="og:image:height" content="1024">
    <meta property="og:image:alt" content="${escapeHtml(roadmap.title)}">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${escapeHtml(title)}">
    <meta name="twitter:description" content="${escapeHtml(description)}">
    <link rel="canonical" href="${escapeHtml(url)}">
    <meta http-equiv="refresh" content="0;url=${escapeHtml(url)}">
  </head>
  <body><p>Redirecionando para a trilha…</p></body>
</html>`;
  }
}
