import Command from '../../Command';

export default abstract class PowerBICommand extends Command {
  protected get resource(): string {
    return 'https://api.powerbi.com';
  }

  public resourceUri(): string | undefined {
    return this.resource;
  }
}
