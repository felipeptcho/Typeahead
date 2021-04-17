import React, {
  useState, useRef, useEffect,
} from 'react';
import cx from 'classnames';
import Highlighter from 'react-highlight-words';
import fuzzysort from 'fuzzysort';
import _ from 'lodash';

/**
 * Sesame and Airbnb have a limit of 5.
 * Let's use 10 so we can have the scroll.
 */
const MAX_RESULTS = 10;

/**
 * There are some duplicated options in the original list. Let's remove them.
 */
const PROVIDED_OPTIONS = _.uniq([
  'Açaí', 'Apple', 'Akee', 'Apricot', 'Avocado', 'Banana', 'Bilberry',
  'Blackberry', 'Blackcurrant', 'Black sapote', 'Blueberry', 'Boysenberry', 'Buddha\'s hand',
  'Crab apples', 'Currant', 'Cherry', 'Cherimoya', 'Chico fruit', 'Cloudberry', 'Coconut',
  'Cranberry', 'Cucumber', 'Damson', 'Date', 'Dragonfruit', 'Pitaya', 'Durian',
  'Elderberry', 'Feijoa', 'Fig', 'Goji berry', 'Gooseberry', 'Grape', 'Raisin', 'Grapefruit',
  'Guava', 'Honeyberry', 'Huckleberry', 'Jabuticaba', 'Jackfruit', 'Jambul',
  'Japanese plum', 'Jostaberry', 'Jujube', 'Juniper berry', 'Kiwano', 'Kiwifruit',
  'Kumquat', 'Lemon', 'Lime', 'Loquat', 'Longan', 'Lychee', 'Mango', 'Mangosteen',
  'Marionberry', 'Melon', 'Cantaloupe', 'Honeydew', 'Watermelon', 'Miracle fruit',
  'Mulberry', 'Nectarine', 'Nance', 'Olive', 'Orange', 'Blood orange', 'Clementine',
  'Mandarine', 'Tangerine', 'Papaya', 'Passionfruit', 'Peach', 'Pear', 'Persimmon',
  'Plantain', 'Plum', 'Prune', 'Pineapple', 'Pineberry', 'Plumcot', 'Pomegranate',
  'Pomelo', 'Purple mangosteen', 'Quince', 'Raspberry', 'Salmonberry', 'Rambutan',
  'Redcurrant', 'Salal', 'Salak', 'Satsuma', 'Soursop', 'Star apple', 'Star fruit',
  'Strawberry', 'Surinam cherry', 'Tamarillo', 'Tamarind', 'Ugli fruit', 'White currant',
  'White sapote', 'Yuzu', 'Avocado', 'Bell pepper', 'Chili pepper', 'Corn kernel',
  'Cucumber', 'Eggplant', 'Olive', 'Pea', 'Pumpkin', 'Squash', 'Tomato', 'Zucchini',
]);

const removeAccents = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

type Target = {
  original: string
  normalized: string
};

const targets: Target[] = PROVIDED_OPTIONS
  .map((option) => ({ original: option, normalized: removeAccents(option) }));

type Props = {
  name: string
  placeholder?: string
};

const Typeahead: React.FC<Props> = ({ name, placeholder }) => {
  const [hasFocus, setFocus] = useState<boolean>(false);
  const [value, setValue] = useState<string>('');
  const [preIndex, setPreIndex] = useState<number>(-1);
  const inputEl = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (preIndex !== -1) {
      // TODO: This is not the right way. We should use useRef() instead.
      document.querySelectorAll('.option')[preIndex].scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [preIndex]);

  const removeFocus = () => {
    if (inputEl.current) {
      inputEl.current.blur();
    }
  };

  const handleFocus = () => {
    setFocus(true);
  };

  const handleBlur = () => {
    setFocus(false);
    setPreIndex(-1);
  };

  const handleChange = (e: React.FormEvent<HTMLInputElement>) => {
    setValue(e.currentTarget.value);
    setPreIndex(-1);
  };

  const handleOptionClick = (option: string) => () => {
    setValue(option);
    removeFocus();
  };

  const handleMouseMove = (index: number) => () => {
    if (preIndex !== index) {
      setPreIndex(index);
    }
  };

  const handleMouseLeave = () => {
    setPreIndex(-1);
  };

  const trimmedValue = value.trim();
  let searchResults: Fuzzysort.KeyResults<Target> = [] as unknown as Fuzzysort.KeyResults<Target>;

  if (trimmedValue) {
    searchResults = fuzzysort.go(removeAccents(trimmedValue), targets, {
      key: 'normalized',
      limit: MAX_RESULTS,
    });
  }

  const handleKeyUp = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'Escape':
        removeFocus();
        break;
      case 'ArrowDown':
        // We use % to make the index run in a circular way.
        setPreIndex(((preIndex + 2) % (searchResults.length + 1)) - 1);
        break;
      case 'ArrowUp':
        if (preIndex === -1) {
          setPreIndex(searchResults.length - 1);
        } else {
          setPreIndex((preIndex % (searchResults.length + 1)) - 1);
        }
        break;
      case 'Enter':
        if (preIndex !== -1) {
          setValue(searchResults[preIndex].obj.original);
          removeFocus();
        }
        break;
      default:
        //
    }
  };

  return (
    <div className="relative flex">
      <input
        ref={inputEl}
        name={name}
        placeholder={placeholder}
        value={preIndex !== -1 ? searchResults[preIndex].obj.original : value}
        className="flex-1 w-60 p-4 border border-solid border-gray-200 rounded"
        onFocus={handleFocus}
        onBlur={handleBlur}
        onChange={handleChange}
        onKeyUp={handleKeyUp}
      />
      {hasFocus && searchResults.length ? (
        <div
          className={cx(
            'absolute top-16 z-10',
            'box-content bg-white w-60 max-h-60 py-4',
            'border border-solid border-gray-200 rounded',
            {
              'overflow-y-auto': searchResults.length > 5,
            },
          )}
        >
          {trimmedValue && searchResults.map((result, index) => (
            <div
              key={result.obj.original} // In real life, we would probably use an id.
              className={cx(
                'option',
                'flex items-center h-12 px-4',
                {
                  'bg-gray-100': preIndex !== -1 && searchResults[preIndex].obj.original === result.obj.original,
                },
              )}
              onMouseDown={(e) => e.preventDefault()}
              onMouseMove={handleMouseMove(index)}
              onMouseLeave={handleMouseLeave}
              onClick={handleOptionClick(result.obj.original)}
            >
              <Highlighter
                highlightTag="strong"
                searchWords={[]} // required prop, but not useful for us
                findChunks={() => result.indexes.map((i) => ({ start: i, end: i + 1 }))}
                autoEscape
                textToHighlight={result.obj.original}
              />
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
};

export default Typeahead;
