import { EmbedBuilder } from 'discord.js';

export function buildHelpEmbed(commandPrefix: string): EmbedBuilder {
  return new EmbedBuilder()
    .setColor(0x111827)
    .setAuthor({
      name: '📘 Guide rapide'
    })
    .setTitle('Brainrot Collector')
    .setDescription(
      [
        `Boucle principale : \`${commandPrefix}r\` → apparition publique → **RÉCLAMER** → collection → classement.`,
        `Les commandes rapides restent pensées pour le gameplay : \`${commandPrefix}r\`, \`${commandPrefix}p\`, \`${commandPrefix}i\`, \`${commandPrefix}wish\`, \`${commandPrefix}fav\`, \`${commandPrefix}search\`.`
      ].join('\n\n')
    )
    .addFields(
      {
        name: 'Gameplay',
        value: [
          `\`${commandPrefix}r\` ou \`/roll\``,
          `\`${commandPrefix}p\` ou \`/profile\``,
          `\`${commandPrefix}i [@joueur] [tri] [fav]\` ou \`/inventory\``,
          `\`${commandPrefix}lb\` ou \`/leaderboard\``,
          `\`${commandPrefix}tb\` ou \`/topbrainrots\``,
          `\`${commandPrefix}cd\` ou \`/cooldown\``
        ].join('\n'),
        inline: true
      },
      {
        name: 'Collector',
        value: [
          `\`${commandPrefix}wish add <brainrot>\` ou \`/wish add\``,
          `\`${commandPrefix}wish remove <brainrot>\` ou \`/wish remove\``,
          `\`${commandPrefix}wish list\` ou \`/wish list\``,
          `\`${commandPrefix}fav add <brainrot>\` ou \`/favorite add\``,
          `\`${commandPrefix}fav remove <brainrot>\` ou \`/favorite remove\``,
          `\`${commandPrefix}search <brainrot>\` ou \`/search\``
        ].join('\n'),
        inline: true
      },
      {
        name: 'Administration',
        value: [
          `\`${commandPrefix}setup set #salon\``,
          `\`${commandPrefix}setup status\``,
          `\`${commandPrefix}setup reset\``,
          '`/setup set`',
          '`/setup status`'
        ].join('\n'),
        inline: true
      },
      {
        name: 'Règles clés',
        value: [
          'Plusieurs rolls peuvent coexister dans le salon configuré.',
          'Le premier clic valide sur RÉCLAMER gagne.',
          'Un roll reste disponible tant qu’il n’a pas été réclamé.',
          'Les wishes signalent publiquement les drops concernés.'
        ].join('\n')
      },
      {
        name: 'Temps de recharge',
        value: 'Roll : illimité • Claim : illimité'
      }
    )
    .setFooter({
      text: `Astuce : utilise ${commandPrefix}h à tout moment pour revoir ce panneau.`
    });
}
