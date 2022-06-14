import Command from '../../Command';

export default abstract class AzmgmtCommand extends Command {
  protected get resource(): string {
    return 'https://management.azure.com/';
  }

  public resourceUri(): string | undefined {
    return this.resource;
  }
}