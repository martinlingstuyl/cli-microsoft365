import Command from '../../Command';

export default abstract class PowerPlatformCommand extends Command {
  protected get resource(): string {
    return 'https://api.bap.microsoft.com';
  }

  public resourceUri(): string | undefined {
    return this.resource;
  }
}
