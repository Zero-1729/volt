export interface IKeychainResponse<T> {
    error: boolean;
    data: T; // Include error messages here too
}
