using System.Linq.Expressions;
using MongoDB.Driver;

namespace Api.Services;

/// <summary>
/// Generic repository interface for database operations
/// </summary>
/// <typeparam name="T">The type of entity this repository handles</typeparam>
public interface IRepository<T> where T : class
{
    /// <summary>
    /// Retrieves an entity by its ID
    /// </summary>
    /// <param name="id">The unique identifier of the entity</param>
    /// <returns>The entity if found, null otherwise</returns>
    Task<T?> GetByIdAsync(string id);

    /// <summary>
    /// Retrieves all entities of type T
    /// </summary>
    /// <returns>An enumerable collection of all entities</returns>
    Task<IEnumerable<T>> GetAllAsync();

    /// <summary>
    /// Finds a single entity matching the specified predicate
    /// </summary>
    /// <param name="predicate">The condition to match</param>
    /// <returns>The first matching entity if found, null otherwise</returns>
    Task<T?> FindUniqueAsync(Expression<Func<T, bool>> predicate);

    /// <summary>
    /// Finds all entities matching the specified predicate
    /// </summary>
    /// <param name="predicate">The condition to match</param>
    /// <returns>An enumerable collection of matching entities</returns>
    Task<IEnumerable<T>> FindAsync(Expression<Func<T, bool>> predicate);

    /// <summary>
    /// Adds a new entity to the repository
    /// </summary>
    /// <param name="entity">The entity to add</param>
    /// <returns>The added entity with any generated IDs or default values</returns>
    Task<T> AddAsync(T entity);

    /// <summary>
    /// Updates an existing entity in the repository
    /// </summary>
    /// <param name="id">The ID of the entity to update</param>
    /// <param name="entity">The updated entity data</param>
    Task UpdateAsync(string id, T entity);

    /// <summary>
    /// Deletes an entity from the repository
    /// </summary>
    /// <param name="id">The ID of the entity to delete</param>
    Task DeleteAsync(string id);

    /// <summary>
    /// Counts entities matching the optional predicate
    /// </summary>
    /// <param name="predicate">Optional condition to filter entities</param>
    /// <returns>The number of matching entities</returns>
    Task<long> CountAsync(Expression<Func<T, bool>>? predicate = null);

    /// <summary>
    /// Executes an aggregation pipeline and returns the results
    /// </summary>
    /// <typeparam name="TResult">The type of the aggregation result</typeparam>
    /// <param name="pipeline">The MongoDB aggregation pipeline to execute</param>
    /// <returns>The results of the aggregation</returns>
    Task<IEnumerable<TResult>> AggregateAsync<TResult>(PipelineDefinition<T, TResult> pipeline);
}