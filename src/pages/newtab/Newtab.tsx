import { useEffect, useState } from "react";
import "@pages/newtab/Newtab.css";
import Browser from "webextension-polyfill";

type ReadingListItem = {
  Title: string;
  Children: {
    URLString: string; // URL of the item
    URIDictionary?: {
      title?: string; // Title of the item
    };
    ReadingList?: {
      DateAdded?: string; // When the item was added
      DateLastViewed?: string; // When the item was last viewed
      PreviewText?: string; // Preview text
    };
    ReadingListNonSync?: {
      DateLastFetched?: string; // When the item was last fetched
      PreviewText?: string; // Preview text
      Title?: string; // Title of the item
      siteName?: string; // Site name
    };
  }[];
};

type ReadingListItemType = {
  url: string;
  title: string;
  dateAdded?: string;
  dateLastViewed?: string;
  previewText?: string;
  siteName?: string;
  dateLastFetched?: string;
};

async function getReadingList() {
  try {
    const response: { success: boolean; error: string; data: unknown } =
      await Browser.runtime.sendNativeMessage(
        "com.wtf403.safari_reading_list",
        {
          command: "getBookmarks",
        }
      );

    if (!response.success) {
      throw new Error(response.error);
    }

    console.log(response.data);

    const parsedPlist = response.data as {
      Children: ReadingListItem[];
    };

    const readingList = parsedPlist?.Children?.find(
      (child: { Title: string }) => child?.Title === "com.apple.ReadingList"
    ) as ReadingListItem;

    console.log(readingList);

    if (!readingList) {
      console.warn("No Reading List found in the plist.");
      return [];
    }

    const readingListItems = readingList.Children.map((item) => {
      const nonSync = item.ReadingListNonSync || {};
      const readingListData = item.ReadingList || {};
      const uriDict = item.URIDictionary || {};

      return {
        url: item.URLString,
        title: nonSync.Title || uriDict.title || "Untitled",
        dateAdded: readingListData.DateAdded,
        dateLastViewed: readingListData.DateLastViewed,
        previewText: nonSync.PreviewText || readingListData.PreviewText,
        siteName: nonSync.siteName,
        dateLastFetched: nonSync.DateLastFetched,
      };
    });

    return readingListItems;
  } catch (error) {
    console.error("Failed to read Safari Reading List:", error);
    return [];
  }
}

export default function Newtab(): JSX.Element {
  const [readingList, setReadingList] = useState<ReadingListItemType[]>([]);
  const [sortOrder, setSortOrder] = useState<"dateAdded" | "dateLastViewed">(
    "dateAdded"
  );
  const [layout, setLayout] = useState<"grid" | "list">("grid");

  useEffect(() => {
    getReadingList().then((items) => {
      const sorted = [...items].sort((a, b) => {
        const dateA = a[sortOrder]
          ? new Date(a[sortOrder] as string).getTime()
          : 0;
        const dateB = b[sortOrder]
          ? new Date(b[sortOrder] as string).getTime()
          : 0;
        return dateB - dateA;
      });
      setReadingList(sorted);
    });
  }, [sortOrder]);

  return (
    <div className="App">
      <header className="App-header">
        <div className="controls">
          <select
            value={sortOrder}
            onChange={(e) =>
              setSortOrder(e.target.value as "dateAdded" | "dateLastViewed")
            }
          >
            <option value="dateAdded">Sort by Date Added</option>
            <option value="dateLastViewed">Sort by Last Visited</option>
          </select>
          <select
            value={layout}
            onChange={(e) => setLayout(e.target.value as "grid" | "list")}
          >
            <option value="grid">Grid View</option>
            <option value="list">List View</option>
          </select>
        </div>

        <div className={`reading-list ${layout}`}>
          {readingList.map(
            ({
              url,
              title,
              dateAdded,
              dateLastViewed,
              previewText,
              siteName,
            }) => (
              <div key={url} className="reading-list-item">
                <a href={url} className="item-content">
                  <div className="preview-image">
                    <img
                      src={`https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=${url}&size=128`}
                      alt=""
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          "default-favicon.png";
                      }}
                    />
                  </div>
                  <div className="item-details">
                    <h3>{title}</h3>
                    {siteName && <span className="site-name">{siteName}</span>}
                    {previewText && (
                      <p className="preview-text">{previewText}</p>
                    )}
                    <div className="date-info">
                      {dateAdded && (
                        <small>
                          Added: {new Date(dateAdded).toLocaleDateString()}
                        </small>
                      )}
                      {dateLastViewed && (
                        <small>
                          Last visited:{" "}
                          {new Date(dateLastViewed).toLocaleDateString()}
                        </small>
                      )}
                    </div>
                  </div>
                </a>
              </div>
            )
          )}
        </div>
      </header>
    </div>
  );
}
