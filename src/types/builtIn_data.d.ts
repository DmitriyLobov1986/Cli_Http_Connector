declare module 'builtIn/Data' {
  //#region dataApi
  const InputTable: IDataSource // Источник данных с первого порта
  const InputTables: IDataSource[] // Массив входных источников данных
  const OutputTable: IOutputTable // Выходной набор данных
  const InputVariables: IVariables // Входные переменные

  // Перечисления, описывающие метаданные полей и переменных
  enum DataType { // Тип данных
    None = 0,
    Boolean = 1,
    DateTime = 2,
    Float = 3,
    Integer = 4,
    String = 5,
    Variant = 6,
  }

  enum DataKind { // Вид данных
    Undefined = 0,
    Continuous = 1,
    Discrete = 2,
  }

  enum UsageType { // Назначение полей
    Unspecified = 0,
    Excluded = 1,
    Useless = 2,
    Used = 3,
    Input = 3,
    Active = 3,
    Output = 4,
    Predicted = 4,
    Key = 5,
    Group = 6,
    Value = 7,
    Transaction = 8,
    Item = 9,
  }

  // Информация о столбце
  interface IColumnInfo {
    readonly Name: string // Имя
    readonly DisplayName: string // Метка
    readonly DataType: DataType // Тип данных
    readonly DataKind: DataKind // Вид данных
    readonly DefaultUsageType: UsageType // Назначение поля
  }

  // Представление столбца набора данных
  interface IColumn
    extends IColumnInfo,
      Iterable<boolean | number | string | Date | undefined> {
    readonly Index: number // Индекс
    readonly RowCount: number // Количество значений
    // Метод Get возвращает значение столбца по индексу
    Get(row: number): boolean | number | string | Date | undefined
    // Метод IsNull проверяет на Null значение столбца
    IsNull(row: number): boolean
  }

  // Свойства столбца входного набора данных
  interface IIntputColumn extends IColumn {
    readonly UsageType: UsageType // Назначение поля
  }

  // Свойства и методы столбца выходного набора данных
  interface IOutputColumn extends IColumn {
    // Свойства столбца доступны на чтение и запись
    DisplayName: string // Метка
    DataType: DataType // Тип данных
    DataKind: DataKind // Вид данных
    DefaultUsageType: UsageType // Назначение поля
    // Метод Set задает значение поля в записи, созданной методом Append
    Set(value: boolean | number | string | Date | null | undefined): void
  }

  // Доступ к итерируемому списку столбцов по имени и индексу
  interface IIntputColumns extends Iterable<IIntputColumn> {
    [name: string]: IIntputColumn
    [index: number]: IIntputColumn
  }

  // Свойства и методы набора данных
  interface IDataSource {
    readonly Columns: IIntputColumns // Список столбцов
    readonly ColumnCount: number // Количество столбцов
    readonly RowCount: number // Количество строк

    // Метод Get возвращает значение заданной строки в заданном столбце
    Get(row: number, col: number | string): boolean | number | string | Date | undefined
    // Метод IsNull проверяет на Null значение заданной строки в заданном столбце
    IsNull(row: number, col: number | string): boolean
    // Метод GetColumn возвращает столбец источника данных
    GetColumn(col: number | string): IIntputColumn
  }

  // Свойства и методы выходного набора
  interface IOutputTable extends IDataSource {
    readonly Columns: IOutputColumns // Список столбцов
    // Метод AssignColumns создает столбцы из итерируемого источника
    AssignColumns(source: Iteratable<string | IColumnInfo>): void
    // Метод GetColumn возвращает столбец выходного набора
    GetColumn(col: number | string): IOutputColumn
    // Метод AddColumn добавляет столбец в конец списка столбцов
    AddColumn(source?: string | IColumnInfo): IOutputColumn
    // Метод InsertColumn вставляет столбец по заданному индексу
    InsertColumn(col: number, source?: IColumnInfo): IOutputColumn
    // Метод DeleteColumn удаляет столбец по индексу или имени
    DeleteColumn(col: number | string): void
    // Метод ClearColumns удаляет все столбцы
    ClearColumns(): void
    // Метод Append добавляет запись в набор
    Append(): void
    // Метод Set задает значение заданного поля в записи, созданной методом Append
    Set(
      col: number | string,
      value: boolean | number | string | Date | null | undefined
    ): void
  }

  // Доступ к итерируемому списку столбцов выходного набора по имени и индексу
  interface IOutputColumns extends Iterable<IOutputColumn> {
    [index: number]: IOutputColumn
    [name: string]: IOutputColumn
  }

  // Представление входной переменной
  interface IVariable {
    readonly Index: number // Индекс
    readonly Name: string // Имя
    readonly DisplayName: string // Метка
    readonly DataType: DataType // Тип данных
    readonly Value: boolean | number | string | Date | undefined // Значение
    readonly IsNull: boolean // Проверка на Null
  }

  // Доступ к итерируемому списку входных переменных по имени и индексу
  interface IVariableItems extends Iterable<IVariable> {
    [name: string]: IVariable
    [index: number]: IVariable
  }

  // Представление переменных входного порта
  interface IVariables {
    readonly Items: IVariableItems
    readonly Count: number
  }
  //#endregion
}
