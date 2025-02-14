import { Cli } from '../../../../cli/Cli.js';
import { Logger } from '../../../../cli/Logger.js';
import GlobalOptions from '../../../../GlobalOptions.js';
import request, { CliRequestOptions } from '../../../../request.js';
import { formatting } from '../../../../utils/formatting.js';
import { urlUtil } from '../../../../utils/urlUtil.js';
import { validation } from '../../../../utils/validation.js';
import SpoCommand from '../../../base/SpoCommand.js';
import commands from '../../commands.js';

interface CommandArgs {
  options: Options;
}

interface Options extends GlobalOptions {
  webUrl: string;
  listId?: string;
  listTitle?: string;
  listUrl?: string;
  viewId?: string;
  viewTitle?: string;
  id?: string;
  title?: string;
  force?: boolean;
}

class SpoListViewFieldRemoveCommand extends SpoCommand {
  public get name(): string {
    return commands.LIST_VIEW_FIELD_REMOVE;
  }

  public get description(): string {
    return 'Removes the specified field from list view';
  }

  constructor() {
    super();

    this.#initTelemetry();
    this.#initOptions();
    this.#initValidators();
    this.#initOptionSets();
  }

  #initTelemetry(): void {
    this.telemetry.push((args: CommandArgs) => {
      Object.assign(this.telemetryProperties, {
        listId: typeof args.options.listId !== 'undefined',
        listTitle: typeof args.options.listTitle !== 'undefined',
        listUrl: typeof args.options.listUrl !== 'undefined',
        viewId: typeof args.options.viewId !== 'undefined',
        viewTitle: typeof args.options.viewTitle !== 'undefined',
        id: typeof args.options.id !== 'undefined',
        title: typeof args.options.title !== 'undefined',
        force: (!(!args.options.force)).toString()
      });
    });
  }

  #initOptions(): void {
    this.options.unshift(
      {
        option: '-u, --webUrl <webUrl>'
      },
      {
        option: '--listId [listId]'
      },
      {
        option: '--listTitle [listTitle]'
      },
      {
        option: '--listUrl [listUrl]'
      },
      {
        option: '--viewId [viewId]'
      },
      {
        option: '--viewTitle [viewTitle]'
      },
      {
        option: '--id [id]'
      },
      {
        option: '--title [title]'
      },
      {
        option: '-f, --force'
      }
    );
  }

  #initValidators(): void {
    this.validators.push(
      async (args: CommandArgs) => {
        const isValidSharePointUrl: boolean | string = validation.isValidSharePointUrl(args.options.webUrl);
        if (isValidSharePointUrl !== true) {
          return isValidSharePointUrl;
        }

        if (args.options.listId) {
          if (!validation.isValidGuid(args.options.listId)) {
            return `${args.options.listId} is not a valid GUID`;
          }
        }

        if (args.options.viewId) {
          if (!validation.isValidGuid(args.options.viewId)) {
            return `${args.options.viewId} is not a valid GUID`;
          }
        }

        if (args.options.id) {
          if (!validation.isValidGuid(args.options.id)) {
            return `${args.options.viewId} is not a valid GUID`;
          }
        }

        return true;
      }
    );
  }

  #initOptionSets(): void {
    this.optionSets.push(
      { options: ['listId', 'listTitle', 'listUrl'] },
      { options: ['viewId', 'viewTitle'] },
      { options: ['id', 'title'] }
    );
  }

  public async commandAction(logger: Logger, args: CommandArgs): Promise<void> {
    const removeFieldFromView: () => Promise<void> = async (): Promise<void> => {
      try {
        if (this.verbose) {
          await logger.logToStderr(`Getting field ${args.options.id || args.options.title}...`);
        }

        let listSelector: string = '';
        if (args.options.listId) {
          listSelector = `lists(guid'${formatting.encodeQueryParameter(args.options.listId)}')`;
        }
        else if (args.options.listTitle) {
          listSelector = `lists/GetByTitle('${formatting.encodeQueryParameter(args.options.listTitle as string)}')`;
        }
        else if (args.options.listUrl) {
          const listServerRelativeUrl: string = urlUtil.getServerRelativePath(args.options.webUrl, args.options.listUrl);
          listSelector = `GetList('${formatting.encodeQueryParameter(listServerRelativeUrl)}')`;
        }

        const field = await this.getField(args.options, listSelector);
        if (this.verbose) {
          await logger.logToStderr(`Removing field ${args.options.id || args.options.title} from view ${args.options.viewId || args.options.viewTitle}...`);
        }

        const viewSelector: string = args.options.viewId ? `('${formatting.encodeQueryParameter(args.options.viewId)}')` : `/GetByTitle('${formatting.encodeQueryParameter(args.options.viewTitle as string)}')`;
        const postRequestUrl: string = `${args.options.webUrl}/_api/web/${listSelector}/views${viewSelector}/viewfields/removeviewfield('${field.InternalName}')`;

        const postRequestOptions: CliRequestOptions = {
          url: postRequestUrl,
          headers: {
            'accept': 'application/json;odata=nometadata'
          },
          responseType: 'json'
        };

        await request.post(postRequestOptions);
        // REST post call doesn't return anything
      }
      catch (err: any) {
        this.handleRejectedODataJsonPromise(err);
      }
    };

    if (args.options.force) {
      await removeFieldFromView();
    }
    else {
      const result = await Cli.promptForConfirmation({ message: `Are you sure you want to remove the field ${args.options.id || args.options.title} from the view ${args.options.viewId || args.options.viewTitle} from list ${args.options.listId || args.options.listTitle} in site ${args.options.webUrl}?` });

      if (result) {
        await removeFieldFromView();
      }
    }
  }

  private async getField(options: Options, listSelector: string): Promise<{ InternalName: string; }> {
    const fieldSelector: string = options.id ? `/getbyid('${formatting.encodeQueryParameter(options.id)}')` : `/getbyinternalnameortitle('${formatting.encodeQueryParameter(options.title as string)}')`;
    const getRequestUrl: string = `${options.webUrl}/_api/web/${listSelector}/fields${fieldSelector}`;

    const requestOptions: CliRequestOptions = {
      url: getRequestUrl,
      headers: {
        'accept': 'application/json;odata=nometadata'
      },
      responseType: 'json'
    };

    return request.get(requestOptions);
  }
}

export default new SpoListViewFieldRemoveCommand();