import Command from '../../Command';

export default abstract class GraphCommand extends Command {
  protected get resource(): string {
    return 'https://graph.microsoft.com';
  }

  public resourceUri(): string | undefined {
    return this.resource;
  }
}